import { Injectable, Logger } from '@nestjs/common';
import type { Schemas } from '@qdrant/js-client-rest';

import type {
  MemoryTaxonomyKind,
  MemoryTaxonomyLane,
} from '../../persistence/constants/memory-taxonomy.constant.js';

import { QdrantClientService } from './qdrant-client.service.js';

/** One taxonomy label point to write (id = the Postgres node id). */
export interface TaxonomyLabelPoint {
  id: string;
  vector: number[];
  lane: MemoryTaxonomyLane;
  scopeKey: string;
  kind: MemoryTaxonomyKind;
  parentId: string;
  normalizedName: string;
}

/** One semantic label hit (probe candidate). */
export interface TaxonomyLabelHit {
  id: string;
  score: number;
  normalizedName: string;
}

/**
 * Qdrant storage for taxonomy label embeddings — one point per taxonomy
 * registry node in the model-namespaced taxonomy collection. The Postgres
 * registry owns the labels/hierarchy (and survives embed-model switches);
 * this collection owns the vectors for semantic probing and is re-minted
 * lazily against a fresh collection after a model switch.
 */
@Injectable()
export class TaxonomyVectorRepository {
  private readonly logger = new Logger(TaxonomyVectorRepository.name);

  constructor(private readonly clientService: QdrantClientService) {}

  private get collection(): string {
    return this.clientService.taxonomyCollection;
  }

  /** Which of the given node ids already carry a vector (lazy re-embed check). */
  async listExistingIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const client = this.clientService.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (!exists) return new Set();
    const result = await client.retrieve(this.collection, {
      ids,
      with_payload: false,
      with_vector: false,
    });
    return new Set(result.map((point) => String(point.id)));
  }

  /** Upsert label points (idempotent by node id). */
  async upsertLabelPoints(points: TaxonomyLabelPoint[]): Promise<void> {
    if (points.length === 0) return;
    const client = this.clientService.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (!exists) {
      this.logger.warn(
        `Taxonomy collection "${this.collection}" missing — label vectors skipped`,
      );
      return;
    }
    await client.upsert(this.collection, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: {
          lane: point.lane,
          scope_key: point.scopeKey,
          kind: point.kind,
          parent_id: point.parentId,
          normalized_name: point.normalizedName,
        },
      })),
    });
  }

  /**
   * Semantic probe: top-k label candidates of one kind/scope (optionally
   * under one parent) nearest the query vector.
   */
  async searchLabels(input: {
    lane: MemoryTaxonomyLane;
    scopeKey: string;
    kind: MemoryTaxonomyKind;
    parentId?: string;
    vector: number[];
    limit: number;
  }): Promise<TaxonomyLabelHit[]> {
    const client = this.clientService.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (!exists) return [];
    const must: Schemas['Filter']['must'] = [
      { key: 'lane', match: { value: input.lane } },
      { key: 'scope_key', match: { value: input.scopeKey } },
      { key: 'kind', match: { value: input.kind } },
    ];
    if (input.parentId !== undefined) {
      must?.push({ key: 'parent_id', match: { value: input.parentId } });
    }
    const result = await client.query(this.collection, {
      query: input.vector,
      filter: { must },
      limit: input.limit,
      with_payload: ['normalized_name'],
    });
    return result.points.map((hit) => ({
      id: String(hit.id),
      score: hit.score,
      normalizedName: (hit.payload?.normalized_name as string) ?? '',
    }));
  }

  /** Vectors of the given node ids (missing ids simply absent) — the reconciliation sweep's pairwise-scoring input. */
  async listLabelVectors(ids: string[]): Promise<Map<string, number[]>> {
    const result = new Map<string, number[]>();
    if (ids.length === 0) return result;
    const client = this.clientService.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (!exists) return result;
    const points = await client.retrieve(this.collection, {
      ids,
      with_payload: false,
      with_vector: true,
    });
    for (const point of points) {
      if (Array.isArray(point.vector) && typeof point.vector[0] === 'number') {
        result.set(String(point.id), point.vector as number[]);
      }
    }
    return result;
  }

  /** Drop one node's label point (merge cleanup — the source node is gone). */
  async deleteLabelPoints(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const client = this.clientService.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (!exists) return;
    await client.delete(this.collection, { points: ids, wait: true });
  }
}
