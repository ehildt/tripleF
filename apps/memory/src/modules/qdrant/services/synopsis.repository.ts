import { Injectable } from '@nestjs/common';

import { groupHeatIncrements } from './helpers/group-heat-increments.helper.js';
import { synopsisText } from './helpers/synopsis-text.helper.js';
import { QdrantClientService } from './qdrant-client.service.js';
import type {
  SynopsisHit,
  SynopsisLane,
  SynopsisPoint,
  SynopsisRecord,
} from './synopsis.repository.types.js';

/**
 * Qdrant storage for the cluster-synopsis layer — one embedded point per
 * cluster row, in a dedicated model-namespaced collection per lane
 * (`<lane>-synopsis_<model>`). Physically separate from the lane
 * collections so a synthesized summary can never surface as a verbatim fact
 * or encyclopedia passage on the recall paths (no exclusion filters needed —
 * structural containment).
 *
 * Read paths degrade to empty when the collection is missing — a synopsis
 * outage never breaks the cluster job or the probe.
 */
/** The raw Qdrant point stub these lookups hand to the mapper. */
interface SynopsisRawQueryPoint {
  /** Point id (untyped at the wire). */
  id: unknown;
  /** Stored payload (absent on payload-less queries). */
  payload?: Record<string, unknown> | null;
}

@Injectable()
export class SynopsisRepository {
  constructor(private readonly clientService: QdrantClientService) {}

  /** Write synopsis points (upsert — deterministic ids make re-runs idempotent). */
  async upsertSynopses(
    lane: SynopsisLane,
    points: SynopsisPoint[],
  ): Promise<void> {
    if (points.length === 0) return;
    if (!(await this.clientService.hasSynopsisCollection(lane))) return;
    await this.clientService.getClient().upsert(this.collectionFor(lane), {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: {
          summarizes_cluster_id: point.clusterId,
          scope_key: point.scopeKey,
          level: point.level,
          title: point.title,
          summary: point.summary,
          member_count: point.memberCount,
          text: synopsisText(point.title, point.summary),
        },
      })),
    });
  }

  /**
   * Every synopsis of one scope (one level when given), with vectors — the
   * recursion's input: level-n synopses get clustered into level-(n+1).
   */
  async scrollSynopses(
    lane: SynopsisLane,
    scopeKey: string,
    level?: number,
  ): Promise<SynopsisPoint[]> {
    if (!(await this.clientService.hasSynopsisCollection(lane))) return [];
    const must: Array<Record<string, unknown>> = [
      { key: 'scope_key', match: { value: scopeKey } },
    ];
    if (level !== undefined) {
      must.push({ key: 'level', match: { value: level } });
    }
    const points: SynopsisPoint[] = [];
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await this.clientService
        .getClient()
        .scroll(this.collectionFor(lane), {
          filter: { must },
          limit: 128,
          offset: offset ?? undefined,
          with_payload: true,
          with_vector: true,
        });
      for (const point of scroll.points) {
        const record = this.toRecord(point);
        const vector = point.vector;
        if (!record || !Array.isArray(vector) || typeof vector[0] !== 'number')
          continue;
        points.push({ ...record, vector: vector as number[] });
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return points;
  }

  /**
   * Semantic search over one scope's synopses — the probe's collapsed
   * retrieval path: all hierarchy levels in one kNN, best score wins.
   */
  async searchSynopses(
    lane: SynopsisLane,
    scopeKey: string,
    vector: number[],
    limit: number,
  ): Promise<SynopsisHit[]> {
    if (!(await this.clientService.hasSynopsisCollection(lane))) return [];
    const result = await this.clientService
      .getClient()
      .query(this.collectionFor(lane), {
        query: vector,
        limit,
        with_payload: true,
        filter: {
          must: [{ key: 'scope_key', match: { value: scopeKey } }],
        },
      });
    return result.points.flatMap((point) => {
      const record = this.toRecord(point);
      return record ? [{ ...record, score: point.score }] : [];
    });
  }

  /**
   * Drop synopsis points whose cluster vanished from the scope's row set —
   * the membership-drift cleanup that mirrors `replaceScope`: a replaced
   * cluster leaves no stale synopsis behind.
   */
  async deleteSynopsesNotIn(
    lane: SynopsisLane,
    scopeKey: string,
    keepClusterIds: Set<string>,
  ): Promise<void> {
    if (!(await this.clientService.hasSynopsisCollection(lane))) return;
    const stale = (await this.scrollSynopses(lane, scopeKey))
      .filter((point) => !keepClusterIds.has(point.clusterId))
      .map((point) => point.id);
    if (stale.length === 0) return;
    await this.clientService.getClient().delete(this.collectionFor(lane), {
      wait: true,
      points: stale,
    });
  }

  /**
   * Increment probe heat on synopsis hits: `heat_amount` +1,
   * `heat_timestamp` = now — one batched setPayload per distinct current
   * count. Approximate under concurrency (last-writer-wins) — acceptable
   * for an access-frequency metric. Degrades silently when the synopsis
   * collection is missing.
   */
  async incrementHeat(
    lane: SynopsisLane,
    hits: ReadonlyArray<{ id: string; heatAmount?: number }>,
  ): Promise<void> {
    if (hits.length === 0) return;
    if (!(await this.clientService.hasSynopsisCollection(lane))) return;
    const timestamp = new Date().toISOString();
    const client = this.clientService.getClient();
    for (const group of groupHeatIncrements(hits)) {
      await client.setPayload(this.collectionFor(lane), {
        payload: { heat_amount: group.nextAmount, heat_timestamp: timestamp },
        points: group.ids,
        wait: false,
      });
    }
  }

  private collectionFor(lane: SynopsisLane): string {
    return lane === 'partition'
      ? this.clientService.partitionSynopsisCollection
      : this.clientService.encyclopediaSynopsisCollection;
  }

  private toRecord(point: SynopsisRawQueryPoint): SynopsisRecord | undefined {
    const payload = point.payload ?? {};
    const clusterId = payload.summarizes_cluster_id as string | undefined;
    const scopeKey = payload.scope_key as string | undefined;
    if (!clusterId || !scopeKey) return undefined;
    return {
      id: String(point.id),
      clusterId,
      scopeKey,
      level: (payload.level as number) ?? 0,
      title: (payload.title as string) ?? '',
      summary: (payload.summary as string) ?? '',
      memberCount: (payload.member_count as number) ?? 0,
      heatAmount: payload.heat_amount as number | undefined,
      heatTimestamp: payload.heat_timestamp as string | undefined,
    };
  }
}
