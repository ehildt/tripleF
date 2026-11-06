import { Inject, Injectable, Logger } from '@nestjs/common';

import { CONSTELLATION_NODE_LIMIT_MAX } from '../constants/constellation-node-limit.constant.js';
import {
  BRIDGE_TAG,
  CONVICTION_TAG,
} from '../constants/conviction.constant.js';
import {
  DENSE_VECTOR,
  QDRANT_CONFIG,
  SPARSE_VECTOR,
} from '../constants/qdrant.constants.js';
import { buildFusionQuery } from '../helpers/build-fusion-query.helper.js';
import { buildMemoryMust } from '../helpers/build-memory-filters.helper.js';
import { buildSparseVector } from '../helpers/build-sparse-vector.helper.js';
import type {
  ListMemoryInput,
  MemoryPoint,
  SearchMemoryInput,
  UpsertBatchInput,
} from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { groupHeatIncrements } from './helpers/group-heat-increments.helper.js';
import { mapMemoryPointToUpsert } from './helpers/map-memory-point-to-upsert.helper.js';
import { MemoryGraphRepository } from './memory-graph.repository.js';
import { MemoryOverridesService } from './memory-overrides.service.js';
import type {
  DeleteMemoryConversationInput,
  MemoryHeatHit,
  SearchMemoryBridgesInput,
  SearchMemoryConvictionsInput,
} from './memory-record.repository.types.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Candidate pool for the rescore — wider than the final limit so the formula has room to re-rank. */
const RECENCY_PREFETCH_MULTIPLIER = 4;
/** Additive recall boost for consolidated/reflected records. */
const CURATED_BOOST_WEIGHT = 0.1;
/** Scroll page size for id/vector sweeps. */
const SCROLL_PAGE = 500;

/** Raw Qdrant query point accepted by the canonical memory-point mapper. */
interface MemoryRawQueryPoint {
  /** Untyped point id returned by Qdrant. */
  id: unknown;
  /** Query score when the request included ranking. */
  score?: number;
  /** Stored payload when requested by the query. */
  payload?: Record<string, unknown> | null;
}

/** Qdrant filter used to resolve records before deletion. */
interface MemoryDeleteFilter {
  /** Conditions every matching point must satisfy. */
  must?: Array<Record<string, unknown>>;
  /** Alternative conditions accepted by the deletion query. */
  should?: Array<Record<string, unknown>>;
}

/** Owns memory-point CRUD, semantic retrieval, and retrieval-heat writes. */
@Injectable()
export class MemoryRecordRepository {
  private readonly logger = new Logger(MemoryRecordRepository.name);

  constructor(
    private readonly clientService: QdrantClientService,
    private readonly overrides: MemoryOverridesService,
    private readonly graph: MemoryGraphRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  /** Resolved memory collection name. */
  get collection(): string {
    return this.clientService.collection;
  }

  /** Upsert one batch and synchronize its graph edges unless skipped. */
  async upsertBatch(input: UpsertBatchInput): Promise<void> {
    // Missing collection means memory is off or wiped; the turn continues.
    if (!(await this.clientService.hasCollection())) return;
    const client = this.clientService.getClient();
    const layout = await this.clientService.vectorLayout(this.collection);
    const createdAt = new Date().toISOString();
    await client.upsert(this.collection, {
      wait: true,
      points: input.points.map((point) =>
        mapMemoryPointToUpsert(point, input, createdAt, layout),
      ),
    });

    const lane = input.memoryPartition
      ? 'partition'
      : input.memoryCognition
        ? 'cognition'
        : undefined;
    const scopeKey = input.memoryPartition ?? input.memoryCognition;
    if (!lane || !scopeKey || input.skipLinks) return;
    // A missing edge degrades to an unlinked dot, never a failed write.
    try {
      await this.graph.syncLinks(lane, scopeKey, input.points);
    } catch (error) {
      this.logger.warn(
        `Link-graph sync skipped for ${lane}/${scopeKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Search fact, episode, or cognition records with optional scope filters. */
  async searchMemory(input: SearchMemoryInput): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const layout = await this.clientService.vectorLayout(this.collection);
    const limit = Math.min(input.limit ?? 5, 5);
    const filter = {
      must: buildMemoryMust(input),
      must_not: [
        { key: 'superseded', match: { value: true } },
        { key: 'tags', match: { any: [BRIDGE_TAG] } },
      ],
    };

    // Recency blending uses dense-only search because its formula operates on
    // cosine scores rather than hybrid-rank scores.
    if (input.recency) {
      const result = await client.query(this.collection, {
        prefetch: {
          query: input.vector,
          ...(layout.named ? { using: DENSE_VECTOR } : {}),
          limit: Math.max(limit * RECENCY_PREFETCH_MULTIPLIER, 20),
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
      });
      return result.points.map((point) => this.toMemoryPoint(point));
    }

    // Text queries use dense + lexical fusion when sparse vectors are live;
    // raw-vector queries use dense-only retrieval.
    const sparse = input.text ? buildSparseVector(input.text) : undefined;
    const hybrid =
      layout.sparse &&
      this.config.hybridEnabled &&
      sparse !== undefined &&
      sparse.indices.length > 0;
    const result = await client.query(this.collection, {
      prefetch: hybrid
        ? {
            prefetch: [
              {
                query: input.vector,
                using: DENSE_VECTOR,
                limit: Math.max(limit * RECENCY_PREFETCH_MULTIPLIER, 20),
                score_threshold: this.config.scoreThreshold,
                filter,
              },
              {
                query: sparse,
                using: SPARSE_VECTOR,
                limit: this.config.hybridSparseLimit,
                filter,
              },
            ],
            query: buildFusionQuery(this.config),
            limit: Math.max(limit * RECENCY_PREFETCH_MULTIPLIER, 20),
          }
        : {
            query: input.vector,
            ...(layout.named ? { using: DENSE_VECTOR } : {}),
            limit: Math.max(limit * RECENCY_PREFETCH_MULTIPLIER, 20),
            score_threshold: this.config.scoreThreshold,
            filter,
          },
      query: {
        formula: {
          sum: ['$score', ...this.curatedBoostTerms()],
        },
      },
      limit,
      with_payload: true,
    });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /** Search synthesized gap-closing bridge records in one partition. */
  async searchBridges(input: SearchMemoryBridgesInput): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const layout = await this.clientService.vectorLayout(this.collection);
    const result = await client.query(this.collection, {
      query: input.vector,
      ...(layout.named ? { using: DENSE_VECTOR } : {}),
      limit: Math.min(input.limit ?? 5, 5),
      score_threshold: this.config.scoreThreshold,
      with_payload: true,
      filter: {
        must: [
          { key: 'memory_partition', match: { value: input.memoryPartition } },
          { key: 'tags', match: { any: [BRIDGE_TAG] } },
        ],
        must_not: [{ key: 'superseded', match: { value: true } }],
      },
    });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /** Search synthesized conviction records in one cognition scope. */
  async searchConvictions(
    input: SearchMemoryConvictionsInput,
  ): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const layout = await this.clientService.vectorLayout(this.collection);
    const result = await client.query(this.collection, {
      query: input.vector,
      ...(layout.named ? { using: DENSE_VECTOR } : {}),
      limit: Math.min(input.limit ?? 5, 5),
      score_threshold: this.config.scoreThreshold,
      with_payload: true,
      filter: {
        must: [
          { key: 'memory_cognition', match: { value: input.memoryCognition } },
          { key: 'tags', match: { any: [CONVICTION_TAG] } },
        ],
        must_not: [{ key: 'superseded', match: { value: true } }],
      },
    });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /** Curated records receive a bounded boost only among relevant candidates. */
  private curatedBoostTerms(): Array<Record<string, unknown>> {
    return [
      {
        mult: [
          CURATED_BOOST_WEIGHT,
          { key: 'is_consolidated', match: { value: true } },
        ],
      },
      {
        mult: [
          CURATED_BOOST_WEIGHT,
          { key: 'is_reflected', match: { value: true } },
        ],
      },
    ];
  }

  /** List records without a vector, newest first, for inspection surfaces. */
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

  /** Set payload keys on a specific set of memory points. */
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

  /** Increment retrieval heat without blocking the recall hot path. */
  async incrementHeat(hits: ReadonlyArray<MemoryHeatHit>): Promise<void> {
    if (hits.length === 0) return;
    if (!(await this.clientService.hasCollection())) return;
    const timestamp = new Date().toISOString();
    const client = this.clientService.getClient();
    for (const group of groupHeatIncrements(hits)) {
      await client.setPayload(this.collection, {
        payload: { heat_amount: group.nextAmount, heat_timestamp: timestamp },
        points: group.ids,
        wait: false,
      });
    }
  }

  /** Load non-empty text values for the requested point ids. */
  async getTextsByIds(ids: string[]): Promise<Map<string, string>> {
    const texts = new Map<string, string>();
    if (ids.length === 0) return texts;
    if (!(await this.clientService.hasCollection())) return texts;
    const client = this.clientService.getClient();
    const scroll = await client.scroll(this.collection, {
      filter: { must: [{ has_id: ids }] },
      limit: ids.length,
      with_payload: true,
      with_vector: false,
    });
    for (const point of scroll.points) {
      const text = (point.payload?.text as string | undefined)?.trim();
      if (text) texts.set(String(point.id), text);
    }
    return texts;
  }

  /** Delete every fact record belonging to one conversation. */
  async deleteByConversation(
    input: DeleteMemoryConversationInput,
  ): Promise<number> {
    return this.deleteByFilter({ must: buildMemoryMust(input) });
  }

  /** Delete one partition's records and its persisted graph records. */
  async deletePartitionData(partition: string): Promise<number> {
    const deleted = await this.deleteByFilter({
      must: [{ key: 'memory_partition', match: { value: partition } }],
    });
    // Scope cleanup still runs if Qdrant was emptied externally.
    await this.graph.deleteByScope('partition', partition);
    return deleted;
  }

  /** Delete point ids and cascade their graph links and frictions. */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (await this.clientService.hasCollection()) {
      await this.clientService.getClient().delete(this.collection, {
        points: ids,
        wait: true,
      });
    }
    await this.graph.deleteByPointIds(ids);
  }

  private async deleteByFilter(filter: MemoryDeleteFilter): Promise<number> {
    if (!(await this.clientService.hasCollection())) return 0;
    // Filter deletion returns no ids, so resolve them for graph cleanup first.
    const ids = await this.scrollIds(filter);
    if (ids.length === 0) return 0;
    await this.deleteByIds(ids);
    return ids.length;
  }

  /** Scroll every matching point id without payload or vector data. */
  private async scrollIds(filter: MemoryDeleteFilter): Promise<string[]> {
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

  /** Project the stored Qdrant payload into the canonical memory-point model. */
  private toMemoryPoint(point: MemoryRawQueryPoint): MemoryPoint {
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
      community: payload.community as string | undefined,
      subject: payload.subject as string | undefined,
      kind: payload.kind as string | undefined,
      stability: payload.stability as string | undefined,
      path: payload.path as string | undefined,
      createdAt: (payload.created_at as string) ?? '',
      score: point.score,
      isConsolidated: payload.is_consolidated as boolean | undefined,
      isLinked: payload.is_linked as boolean | undefined,
      isReflected: payload.is_reflected as boolean | undefined,
      isSynthesized: payload.is_synthesized as boolean | undefined,
      isFriction: payload.is_friction as boolean | undefined,
      superseded: payload.superseded as boolean | undefined,
      supersededBy: payload.superseded_by as string | undefined,
      evidenceIds: payload.evidence_ids as string[] | undefined,
      clusterId: payload.cluster_id as string | undefined,
      heatAmount: payload.heat_amount as number | undefined,
      heatTimestamp: payload.heat_timestamp as string | undefined,
    };
  }
}
