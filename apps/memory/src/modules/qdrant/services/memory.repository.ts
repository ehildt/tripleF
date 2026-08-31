import { Inject, Injectable, Logger } from '@nestjs/common';
import { INSIGHT_TAGS } from '@triplef/agent/schemas';

import {
  type MemoryLinkEdge,
  type MemoryLinkLane,
  MemoryLinkRepository,
  type MemoryLinkRow,
} from '../../persistence/services/memory-link.repository.js';
import { CONSTELLATION_NODE_LIMIT_MAX } from '../constants/constellation-node-limit.constant.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { buildMemoryMust } from '../helpers/build-memory-filters.helper.js';
import type {
  ListMemoryInput,
  MemoryPoint,
  SearchMemoryInput,
  UpsertBatchInput,
} from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { mapFacetHit } from './helpers/map-facet-hit.helper.js';
import { mapMemoryPointToUpsert } from './helpers/map-memory-point-to-upsert.helper.js';
import { mapQueryPointToMemoryPoint } from './helpers/map-query-point-to-memory-point.helper.js';
import { MemoryOverridesService } from './memory-overrides.service.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Candidate pool for the rescore — wider than the final limit so the formula has room to re-rank. */
const RECENCY_PREFETCH_MULTIPLIER = 4;

/** Scroll page size for id/vector sweeps (backfill + delete resolution). */
const SCROLL_PAGE = 500;

/**
 * The only layer that talks Qdrant payloads. Every point belongs to exactly
 * one space, identified by its key: `memory_partition` (the user's fact
 * space — by default the caller's session id, or a user-set partition id from
 * sysctl that survives browser-session rotation) or `memory_cognition` (the
 * AI's living understanding-of-the-user document). The agentic tools always
 * scope reads to the turn's space key; the public endpoints may tighten
 * further (session/conversation/request/role/tags/contains/exact text).
 *
 * One point = one memory record (an extracted fact, an explicitly remembered
 * statement, or the cognition document) whose payload text IS the record.
 * There is no chunk layer: the conversation transcript already lives in the
 * harness history.
 *
 * This repository also owns the constellation link graph: it keeps the
 * precomputed semantic edges (Postgres) in sync with the points (Qdrant) —
 * computing edges on upsert and cascading them on delete — so the dashboard
 * reads a ready graph with zero Qdrant round-trips.
 */
@Injectable()
export class MemoryRepository {
  private readonly logger = new Logger(MemoryRepository.name);

  /** Scopes already backfilled this process lifetime (avoids re-backfilling empty scopes). */
  private readonly backfilledScopes = new Set<string>();

  constructor(
    private readonly clientService: QdrantClientService,
    private readonly overrides: MemoryOverridesService,
    private readonly links: MemoryLinkRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  /** Resolved collection name — read by the relink job for edge rows. */
  get collection(): string {
    return this.clientService.collection;
  }

  /**
   * Batch upsert of one turn-side's records: one point per record with a
   * deterministic id, so the same record restated later overwrites in place.
   * `memory_partition` / `memory_cognition` is the identity key (exactly one
   * is set); session/conversation/request are provenance for later filtering.
   * After the upsert, the batch's semantic edges are recomputed (unless
   * `skipLinks` — episodes are not constellation nodes).
   */
  async upsertBatch(input: UpsertBatchInput): Promise<void> {
    // Collection missing (feature off or Qdrant wiped) ⇒ drop silently: the
    // vectorize pipeline is fire-and-forget and the harness must proceed.
    if (!(await this.clientService.hasCollection())) return;
    const client = this.clientService.getClient();
    const createdAt = new Date().toISOString();
    await client.upsert(this.collection, {
      wait: true,
      points: input.points.map((point) =>
        mapMemoryPointToUpsert(point, input, createdAt),
      ),
    });

    const lane = input.memoryPartition
      ? 'partition'
      : input.memoryCognition
        ? 'cognition'
        : undefined;
    const scopeKey = input.memoryPartition ?? input.memoryCognition;
    if (!lane || !scopeKey || input.skipLinks) return;
    // Graph bookkeeping is warn-and-continue: a missing edge degrades to a
    // dot without links, never a failed write.
    try {
      await this.syncLinks(lane, scopeKey, input.points);
    } catch (error) {
      this.logger.warn(
        `Link-graph sync skipped for ${lane}/${scopeKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Semantic search with optional space scope: `memory_partition`/
   * `memory_cognition` (the identity key) narrows to one caller's memory;
   * every other field (session / role / conversation / request / tags /
   * contains / exact text) is an optional tightening on top.
   */
  async searchMemory(input: SearchMemoryInput): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const limit = Math.min(input.limit ?? 5, 5);
    const filter = { must: buildMemoryMust(input) };

    const result = input.recency
      ? await client.query(this.collection, {
          prefetch: {
            query: input.vector,
            limit: Math.max(limit * RECENCY_PREFETCH_MULTIPLIER, 20),
            // The episode lane's own noise floor — far lower than the
            // fact-lane `scoreThreshold`. Meta-questions ("what were we
            // doing recently?") embed weakly against any single episode, so
            // a hard vector gate here would discard every candidate before
            // the recency formula could rank them.
            score_threshold: this.overrides.getEpisodeScoreThreshold(),
            filter,
          },
          query: {
            formula: {
              sum: [
                '$score',
                {
                  mult: [
                    this.overrides.getEpisodeRecencyWeight(),
                    {
                      exp_decay: {
                        x: { datetime_key: 'created_at' },
                        target: { datetime: new Date().toISOString() },
                        scale: this.overrides.getEpisodeRecencyScaleSeconds(),
                        midpoint: this.overrides.getEpisodeRecencyMidpoint(),
                      },
                    },
                  ],
                },
              ],
            },
          },
          limit,
          with_payload: true,
        })
      : await client.query(this.collection, {
          query: input.vector,
          limit,
          score_threshold: this.config.scoreThreshold,
          with_payload: true,
          filter,
        });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /**
   * Scroll-based listing for the sysctl inspection surface (no vector
   * needed). Ordered newest-first on `created_at` so the capped page always
   * surfaces the most recent records — the `created_at` datetime payload
   * index is created at boot.
   */
  async listMemory(input: ListMemoryInput): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const limit = Math.min(
      input.limit ?? this.overrides.getConstellationNodeLimit(),
      CONSTELLATION_NODE_LIMIT_MAX,
    );
    const result = await client.scroll(this.collection, {
      filter: { must: buildMemoryMust(input) },
      limit,
      with_payload: true,
      with_vector: false,
      order_by: { key: 'created_at', direction: 'desc' },
    });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /**
   * Distinct category values of one partition with point counts — the relink
   * job's inventory. One facet call (Qdrant ≥1.12, keyword index on
   * `category`), exact counts.
   */
  async facetCategories(
    memoryPartition: string,
  ): Promise<Array<{ value: string; count: number }>> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.facet(this.collection, {
      key: 'category',
      limit: 1000,
      exact: true,
      filter: {
        must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
      },
    });
    return result.hits.map(mapFacetHit);
  }

  /** Distinct memory partitions of the collection (facet on the tenant key). */
  async facetPartitions(): Promise<string[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.facet(this.collection, {
      key: 'memory_partition',
      limit: 1000,
      exact: true,
    });
    return result.hits.map((hit) => String(hit.value));
  }

  /** Distinct tag values of one partition — the write/extract vocabulary. */
  async facetTags(
    memoryPartition: string,
  ): Promise<Array<{ value: string; count: number }>> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.facet(this.collection, {
      key: 'tags',
      limit: 1000,
      exact: true,
      filter: {
        must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
      },
    });
    return result.hits.map(mapFacetHit);
  }

  /**
   * Rewrite one category value to its canonical form on every point of a
   * partition — a payload-only change, no vector rewrite, idempotent.
   */
  async collapseCategory(
    memoryPartition: string,
    from: string,
    to: string,
  ): Promise<void> {
    if (!(await this.clientService.hasCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload: { category: to },
      filter: {
        must: [
          { key: 'memory_partition', match: { value: memoryPartition } },
          { key: 'category', match: { value: from } },
        ],
      },
      wait: true,
    });
  }

  /**
   * Scroll one category's points with vectors — the dedupe and linking
   * input. Paginated up to `limit` total points.
   */
  async scrollCategoryPoints(
    memoryPartition: string,
    category: string,
    limit: number,
  ): Promise<
    Array<{
      id: string;
      vector: number[];
      text: string;
      role: MemoryPoint['role'];
      tags: string[];
      createdAt: string;
      requestId?: string;
    }>
  > {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const filter = {
      must: [
        { key: 'memory_partition', match: { value: memoryPartition } },
        { key: 'category', match: { value: category } },
      ],
    };
    const points: Array<{
      id: string;
      vector: number[];
      text: string;
      role: MemoryPoint['role'];
      tags: string[];
      createdAt: string;
      requestId?: string;
    }> = [];
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter,
        limit: Math.min(SCROLL_PAGE, limit - points.length),
        offset: offset ?? undefined,
        with_payload: true,
        with_vector: true,
      });
      for (const point of scroll.points) {
        const vector = point.vector;
        if (!Array.isArray(vector) || typeof vector[0] !== 'number') continue;
        const payload = point.payload ?? {};
        points.push({
          id: String(point.id),
          vector: vector as number[],
          text: (payload.text as string) ?? '',
          role: (payload.role as MemoryPoint['role']) ?? 'user',
          tags: (payload.tags as string[]) ?? [],
          createdAt: (payload.created_at as string) ?? '',
          requestId: payload.request_id as string | undefined,
        });
        if (points.length >= limit) return points;
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return points;
  }

  /**
   * kNN neighbors of one vector, optionally narrowed to one category — the
   * relink job's edge source. Returns id, score, category, and tags so the
   * caller can separate intra- from inter-category edges and apply the
   * shared-tag relatedness rule.
   */
  async queryNeighbors(
    memoryPartition: string,
    category: string | undefined,
    vector: number[],
    limit: number,
    scoreThreshold: number,
  ): Promise<
    Array<{ id: string; score: number; category?: string; tags: string[] }>
  > {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const filter: { must: Array<Record<string, unknown>> } = {
      must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
    };
    if (category) {
      filter.must.push({ key: 'category', match: { value: category } });
    }
    const result = await client.query(this.collection, {
      query: vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: ['category', 'tags'],
      filter,
    });
    return result.points.map(mapQueryPointToMemoryPoint);
  }

  /** Set payload keys on specific points (the relink job's enrichment writes). */
  async setPayloadForPoints(
    ids: string[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (ids.length === 0) return;
    if (!(await this.clientService.hasCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload,
      points: ids,
      wait: true,
    });
  }

  /**
   * Read the precomputed semantic link graph of one scope. On the first read
   * of a scope that has points but no edges yet (fresh deploy or embed-model
   * switch), run a one-time backfill so existing data gets links without a
   * manual step.
   */
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

  /**
   * Recompute the semantic link graph of one scope with the CURRENT link
   * threshold: purge the scope's stored edges, then rerun the bounded
   * backfill over its points. The one-time migration path after raising
   * `MEMORY_LINK_SCORE_THRESHOLD` — stored weak edges never disappear on
   * their own (the lazy backfill only fires on an edge-less scope).
   */
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

  /** Remove every fact record of one conversation within a partition (cleanup / undo). Cognition transcends conversations and survives. */
  async deleteByConversation(input: {
    memoryPartition: string;
    conversationId: string;
  }): Promise<number> {
    return this.deleteByFilter({
      must: buildMemoryMust(input),
    });
  }

  /**
   * Sysctl prune: drop ALL fact records of a space key (the user's memory
   * partition). The cognition lane has its own wipe (deleteCognition) —
   * lanes stay cleanly separable, so a partition prune never touches the
   * AI's understanding of the user.
   */
  async deletePartitionData(partition: string): Promise<number> {
    const deleted = await this.deleteByFilter({
      must: [{ key: 'memory_partition', match: { value: partition } }],
    });
    // Scope-delete the edges too, so a wipe stays clean even if Qdrant was
    // emptied externally and the id-resolution above found nothing.
    await this.links.deleteByScope('partition', this.collection, partition);
    return deleted;
  }

  /** Point-id deletion for the filtered delete path (records resolved first, then removed by id). */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (await this.clientService.hasCollection()) {
      await this.clientService.getClient().delete(this.collection, {
        points: ids,
        wait: true,
      });
    }
    await this.links.deleteByPointIds(ids);
  }

  private async deleteByFilter(filter: {
    must?: Array<Record<string, unknown>>;
    should?: Array<Record<string, unknown>>;
  }): Promise<number> {
    if (!(await this.clientService.hasCollection())) return 0;
    // Resolve matching point ids first so the edge cascade runs on the exact
    // set removed (Qdrant's filter-delete returns no ids).
    const ids = await this.scrollIds(filter);
    if (ids.length === 0) return 0;
    await this.deleteByIds(ids);
    return ids.length;
  }

  /** Scroll every matching point id (paginated, payload/vector-free). */
  private async scrollIds(filter: {
    must?: Array<Record<string, unknown>>;
    should?: Array<Record<string, unknown>>;
  }): Promise<string[]> {
    const client = this.clientService.getClient();
    const ids: string[] = [];
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter,
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: false,
        with_vector: false,
      });
      for (const point of scroll.points) ids.push(String(point.id));
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return ids;
  }

  /**
   * Recompute the semantic edges of a batch of points: query each point's
   * top-k neighbors, replace the batch's existing edges, persist. Idempotent
   * (deterministic ids + unique constraint + delete-first).
   */
  private async syncLinks(
    lane: MemoryLinkLane,
    scopeKey: string,
    points: Array<{ id: string; vector: number[] }>,
  ): Promise<void> {
    if (points.length === 0) return;
    const client = this.clientService.getClient();
    const filter = this.buildLinkFilter(lane, scopeKey);
    const edges: MemoryLinkRow[] = [];
    const seen = new Set<string>();
    for (const point of points) {
      const vector = point.vector;
      if (!Array.isArray(vector) || typeof vector[0] !== 'number') continue;
      const result = await client.query(this.collection, {
        query: vector as number[],
        limit: this.config.linkNeighbors + 1,
        score_threshold: this.config.linkScoreThreshold,
        with_payload: false,
        filter,
      });
      for (const hit of result.points) {
        const targetId = String(hit.id);
        if (targetId === point.id) continue;
        const [source, target] = [point.id, targetId].sort();
        const pairKey = `${source}|${target}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        edges.push({
          lane,
          collection: this.collection,
          scopeKey,
          source,
          target,
          score: hit.score ?? 0,
          kind: 'semantic',
        });
      }
    }
    await this.links.deleteByPointIds(points.map((point) => point.id));
    await this.links.upsertEdges(edges);
  }

  /**
   * One-time cold-start backfill: scroll the scope's points with vectors
   * (bounded by `linkBackfillMaxPoints`) and compute their edges.
   */
  private async backfillLinks(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): Promise<void> {
    if (!(await this.clientService.hasCollection())) return;
    const client = this.clientService.getClient();
    const filter = this.buildLinkFilter(lane, scopeKey);
    const points: Array<{ id: string; vector: number[] }> = [];
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
        const vector = point.vector;
        if (Array.isArray(vector) && typeof vector[0] === 'number') {
          points.push({ id: String(point.id), vector: vector as number[] });
        }
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset || points.length >= maxPoints) break;
    }
    await this.syncLinks(lane, scopeKey, points.slice(0, maxPoints));
  }

  /** Qdrant filter for a lane's kNN queries (cognition excludes episodes). */
  private buildLinkFilter(
    lane: MemoryLinkLane,
    scopeKey: string,
  ): { must: Array<Record<string, unknown>> } | undefined {
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

  private toMemoryPoint(point: {
    id: unknown;
    score?: number;
    payload?: Record<string, unknown> | null;
  }): MemoryPoint {
    const payload = point.payload ?? {};
    return {
      id: String(point.id),
      memoryPartition: payload.memory_partition as string | undefined,
      memoryCognition: payload.memory_cognition as string | undefined,
      sessionId: payload.session_id as string | undefined,
      role: payload.role as MemoryPoint['role'],
      conversationId: payload.conversation_id as string | undefined,
      requestId: payload.request_id as string | undefined,
      text: (payload.text as string) ?? '',
      tags: (payload.tags as string[]) ?? [],
      category: payload.category as string | undefined,
      path: payload.path as string | undefined,
      createdAt: (payload.created_at as string) ?? '',
      score: point.score,
    };
  }
}
