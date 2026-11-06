import { Inject, Injectable } from '@nestjs/common';
import type { QdrantClient } from '@qdrant/js-client-rest';
import { INSIGHT_TAGS } from '@triplef/agent/schemas';

import { MemoryFrictionRepository } from '../../persistence/services/memory-friction.repository.js';
import type { MemoryFrictionEdge } from '../../persistence/services/memory-friction.repository.types.js';
import { MemoryLinkRepository } from '../../persistence/services/memory-link.repository.js';
import type {
  MemoryLinkEdge,
  MemoryLinkLane,
  MemoryLinkRow,
} from '../../persistence/services/memory-link.repository.types.js';
import { DENSE_VECTOR, QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { readDenseVector } from '../helpers/read-dense-vector.helper.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { mapQueryPointToMemoryPoint } from './helpers/map-query-point-to-memory-point.helper.js';
import type {
  MemoryGraphPoint,
  MemoryNeighbor,
} from './memory-graph.repository.types.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Scroll page size for graph backfills. */
const SCROLL_PAGE = 500;

/** Qdrant filter applied to semantic-neighbor queries. */
interface MemoryGraphFilter {
  /** Conditions every graph candidate must satisfy. */
  must: Array<Record<string, unknown>>;
}

/** Owns semantic/evidence graph reads, synchronization, and cleanup. */
@Injectable()
export class MemoryGraphRepository {
  /** Scopes already backfilled during this provider's process lifetime. */
  private readonly backfilledScopes = new Set<string>();

  constructor(
    private readonly clientService: QdrantClientService,
    private readonly links: MemoryLinkRepository,
    private readonly frictions: MemoryFrictionRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  private get collection(): string {
    return this.clientService.collection;
  }

  /** Find kNN neighbors, optionally narrowed to one category. */
  async queryNeighbors(
    memoryPartition: string,
    category: string | undefined,
    vector: number[],
    limit: number,
    scoreThreshold: number,
  ): Promise<MemoryNeighbor[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const layout = await this.clientService.vectorLayout(this.collection);
    const filter: MemoryGraphFilter = {
      must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
    };
    if (category) {
      filter.must.push({ key: 'category', match: { value: category } });
    }
    const result = await client.query(this.collection, {
      query: vector,
      ...(layout.named ? { using: DENSE_VECTOR } : {}),
      limit,
      score_threshold: scoreThreshold,
      with_payload: ['category', 'tags'],
      filter,
    });
    return result.points.map(mapQueryPointToMemoryPoint);
  }

  /** Read one scope's friction edges with the configured read limit. */
  async listFrictions(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): Promise<MemoryFrictionEdge[]> {
    return this.frictions.listFrictions(
      lane,
      this.collection,
      scopeKey,
      this.config.linkReadMax,
    );
  }

  /** Read stored edges, lazily backfilling an edge-less scope once. */
  async listLinks(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): Promise<MemoryLinkEdge[]> {
    const edges = await this.links.listEdges(
      lane,
      this.collection,
      scopeKey,
      this.config.linkReadMax,
    );
    const backfillKey = `${lane}|${this.collection}|${scopeKey}`;
    if (edges.length > 0 || this.backfilledScopes.has(backfillKey)) {
      return edges;
    }
    this.backfilledScopes.add(backfillKey);
    if (await this.clientService.hasCollection()) {
      await this.backfillLinks(lane, scopeKey);
      return this.links.listEdges(
        lane,
        this.collection,
        scopeKey,
        this.config.linkReadMax,
      );
    }
    return edges;
  }

  /** Purge and rebuild one scope's edges with the current link threshold. */
  async recomputeLinks(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): Promise<MemoryLinkEdge[]> {
    await this.links.deleteByScope(lane, this.collection, scopeKey);
    if (await this.clientService.hasCollection()) {
      await this.backfillLinks(lane, scopeKey);
    }
    return this.links.listEdges(
      lane,
      this.collection,
      scopeKey,
      this.config.linkReadMax,
    );
  }

  /** Delete both link and friction rows associated with specific points. */
  async deleteByPointIds(ids: string[]): Promise<void> {
    await this.links.deleteByPointIds(ids);
    await this.frictions.deleteByPointIds(ids);
  }

  /** Delete both link and friction rows associated with one scope. */
  async deleteByScope(lane: MemoryLinkLane, scopeKey: string): Promise<void> {
    await this.links.deleteByScope(lane, this.collection, scopeKey);
    await this.frictions.deleteByScope(lane, this.collection, scopeKey);
  }

  /** Recompute semantic and explicit evidence edges for a batch of points. */
  async syncLinks(
    lane: MemoryLinkLane,
    scopeKey: string,
    points: MemoryGraphPoint[],
  ): Promise<void> {
    if (points.length === 0) return;
    const client = this.clientService.getClient();
    const filter = this.buildLinkFilter(lane, scopeKey);
    const edges: MemoryLinkRow[] = [];
    const seen = new Set<string>();
    await this.collectSemanticEdges(
      lane,
      scopeKey,
      points,
      filter,
      client,
      seen,
      edges,
    );
    this.collectEvidenceEdges(lane, scopeKey, points, seen, edges);
    await this.links.deleteByPointIds(points.map((point) => point.id));
    await this.links.upsertEdges(edges);
  }

  /** Write top-k semantic edges for each point above the configured threshold. */
  private async collectSemanticEdges(
    lane: MemoryLinkLane,
    scopeKey: string,
    points: MemoryGraphPoint[],
    filter: MemoryGraphFilter | undefined,
    client: QdrantClient,
    seen: Set<string>,
    edges: MemoryLinkRow[],
  ): Promise<void> {
    const layout = await this.clientService.vectorLayout(this.collection);
    for (const point of points) {
      const vector = point.vector;
      if (!Array.isArray(vector) || typeof vector[0] !== 'number') continue;
      const result = await client.query(this.collection, {
        query: vector,
        ...(layout.named ? { using: DENSE_VECTOR } : {}),
        limit: this.config.linkNeighbors + 1,
        score_threshold: this.config.linkScoreThreshold,
        with_payload: false,
        filter,
      });
      for (const hit of result.points) {
        const targetId = String(hit.id);
        if (targetId === point.id) continue;
        this.pushEdge(
          lane,
          scopeKey,
          point.id,
          targetId,
          hit.score ?? 0,
          'semantic',
          seen,
          edges,
        );
      }
    }
  }

  /** Write exact evidence edges for partition-lane synthesized records. */
  private collectEvidenceEdges(
    lane: MemoryLinkLane,
    scopeKey: string,
    points: MemoryGraphPoint[],
    seen: Set<string>,
    edges: MemoryLinkRow[],
  ): void {
    // Conviction evidence crosses into the partition scope; cognition upserts
    // therefore never write cross-space graph rows.
    if (lane !== 'partition') return;
    for (const point of points) {
      for (const evidenceId of point.evidenceIds ?? []) {
        this.pushEdge(
          lane,
          scopeKey,
          point.id,
          evidenceId,
          1,
          'evidence',
          seen,
          edges,
        );
      }
    }
  }

  /** Canonicalize a pair, deduplicate it, and append one edge row. */
  private pushEdge(
    lane: MemoryLinkLane,
    scopeKey: string,
    firstPointId: string,
    secondPointId: string,
    score: number,
    kind: 'semantic' | 'evidence',
    seen: Set<string>,
    edges: MemoryLinkRow[],
  ): void {
    const [source, target] = [firstPointId, secondPointId].sort();
    const pairKey = `${source}|${target}`;
    if (seen.has(pairKey)) return;
    seen.add(pairKey);
    edges.push({
      lane,
      collection: this.collection,
      scopeKey,
      source,
      target,
      score,
      kind,
    });
  }

  /** Scroll a scope's vectors and compute its bounded cold-start link set. */
  private async backfillLinks(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): Promise<void> {
    if (!(await this.clientService.hasCollection())) return;
    const client = this.clientService.getClient();
    const filter = this.buildLinkFilter(lane, scopeKey);
    const points: MemoryGraphPoint[] = [];
    let offset: string | number | null = null;
    const maxPoints = this.config.linkBackfillMaxPoints;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter,
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: false,
        with_vector: true,
      });
      for (const point of scroll.points) {
        const vector = readDenseVector(point.vector);
        if (vector.length > 0) {
          points.push({ id: String(point.id), vector });
        }
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset || points.length >= maxPoints) break;
    }
    await this.syncLinks(lane, scopeKey, points.slice(0, maxPoints));
  }

  /** Build the lane filter; cognition excludes non-insight episodes. */
  private buildLinkFilter(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): MemoryGraphFilter | undefined {
    if (lane === 'partition') {
      return {
        must: [{ key: 'memory_partition', match: { value: scopeKey } }],
      };
    }
    if (lane === 'cognition') {
      return {
        must: [
          { key: 'memory_cognition', match: { value: scopeKey } },
          { key: 'tags', match: { any: INSIGHT_TAGS } },
        ],
      };
    }
    return undefined;
  }
}
