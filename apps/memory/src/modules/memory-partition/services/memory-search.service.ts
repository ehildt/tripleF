import { Injectable } from '@nestjs/common';
import { TextToLines } from '@triplef/helpers/text-to-lines';

import {
  type MemoryClusterRecord,
  MemoryClusterRepository,
} from '../../persistence/services/memory-cluster.repository.js';
import type {
  MemoryPoint,
  MemoryScopeFilters,
} from '../../qdrant/models/memory.model.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import {
  type SynopsisHit,
  SynopsisRepository,
} from '../../qdrant/services/synopsis.repository.js';

interface SearchInput extends MemoryScopeFilters {
  limit?: number;
  /** Blend recency into the ranking (episode probe). */
  recency?: boolean;
}

/** Search result with the hits' cluster summaries attached (graph-augmented recall). */
interface MemorySearchWithClusters {
  points: MemoryPoint[];
  clusters: MemoryClusterRecord[];
}

/**
 * The read path for the fact partition: search by text or by a raw vector.
 * Both delegate to the partition-scoped repository search; a failed embed
 * degrades to an empty result so the harness never breaks on memory.
 *
 * Text search is multi-variant retrieval: the query is embedded as the full
 * text AND as its individual sentences (TextToLines), each variant is searched
 * with the same payload filters, and the results are merged per point keeping
 * the best score. Multi-variant queries recall segments of long user messages
 * that the whole-text embedding would dilute — with topic/tag filters applied
 * to every variant so the restriction is exact, not best-effort.
 */
@Injectable()
export class MemorySearchService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly memoryRepository: MemoryRepository,
    private readonly clusters: MemoryClusterRepository,
    private readonly synopses: SynopsisRepository,
    private readonly overrides: MemoryOverridesService,
  ) {}

  async searchByText(
    input: SearchInput & { text: string },
  ): Promise<MemoryPoint[]> {
    try {
      const variants = this.buildQueryVariants(input.text);
      if (variants.length === 0) return [];

      // Queries are the query side of the retrieval pair — the model's query
      // prompt (e.g. `search_query: `) is applied by the embedding service so
      // query and document vectors share the trained space.
      const vectors = await this.embeddingService.embed(variants, 'query');
      if (vectors.length !== variants.length) return [];

      const merged = new Map<string, MemoryPoint>();
      for (const vector of vectors) {
        const results = await this.memoryRepository.searchMemory({
          memoryPartition: input.memoryPartition,
          sessionId: input.sessionId,
          vector,
          limit: input.limit,
          role: input.role,
          conversationId: input.conversationId,
          requestId: input.requestId,
          tags: input.tags,
          category: input.category,
          contains: input.contains,
          recency: input.recency,
        });
        for (const hit of results) {
          const existing = merged.get(hit.id);
          if (!existing || (hit.score ?? 0) > (existing.score ?? 0)) {
            merged.set(hit.id, hit);
          }
        }
      }

      return [...merged.values()]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, input.limit ?? 5);
    } catch {
      return [];
    }
  }

  async searchByVector(
    input: SearchInput & { vector: number[] },
  ): Promise<MemoryPoint[]> {
    return this.searchRepository({
      memoryPartition: input.memoryPartition,
      sessionId: input.sessionId,
      vector: input.vector,
      limit: input.limit,
      role: input.role,
      conversationId: input.conversationId,
      requestId: input.requestId,
      tags: input.tags,
      category: input.category,
      contains: input.contains,
    });
  }

  /**
   * Graph-augmented text search: the plain kNN hits plus the cluster
   * summaries of the clusters those hits belong to — the local-search
   * context that lets the model answer cross-cutting questions without
   * reading every member. Clusters are attached by the hits'
   * `cluster_id` payload (written by the cluster job); a cold scope with
   * no clusters yet degrades to plain hits.
   */
  async searchByTextWithClusters(
    input: SearchInput & { text: string },
  ): Promise<MemorySearchWithClusters> {
    const points = await this.searchByText(input);
    return this.attachClusters(points);
  }

  /** Graph-augmented vector search (see searchByTextWithClusters). */
  async searchByVectorWithClusters(
    input: SearchInput & { vector: number[] },
  ): Promise<MemorySearchWithClusters> {
    const points = await this.searchByVector(input);
    return this.attachClusters(points);
  }

  /** Look up the clusters of the hits' `cluster_id` payloads. */
  private async attachClusters(
    points: MemoryPoint[],
  ): Promise<MemorySearchWithClusters> {
    const ids = [
      ...new Set(
        points
          .map((point) => point.clusterId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const clusters = await this.clusters.findByIds(ids);
    return { points, clusters };
  }

  /**
   * Semantic search over one scope's cluster-synopsis layer — the Raptor
   * probe path: a cross-cutting query vector-matches the community summary
   * directly, even when no single record ranks highly. Partition scope hits
   * the partition synopsis collection; omitting it searches the global
   * encyclopedia synopses. All hierarchy levels compete in one kNN
   * (collapsed retrieval). Raptor off → always empty; any failure → empty.
   */
  async searchSynopses(input: {
    memoryPartition?: string;
    text: string;
    limit?: number;
  }): Promise<SynopsisHit[]> {
    if (!this.overrides.getRaptorEnabled()) return [];
    try {
      const vectors = await this.embeddingService.embed([input.text], 'query');
      if (vectors.length !== 1) return [];
      const lane = input.memoryPartition ? 'partition' : 'encyclopedia';
      const scopeKey = input.memoryPartition ?? 'global';
      return this.synopses.searchSynopses(
        lane,
        scopeKey,
        vectors[0],
        input.limit ?? 2,
      );
    } catch {
      return [];
    }
  }

  /** Query variants: the full text plus its deduped, non-empty sentences. */
  private buildQueryVariants(text: string): string[] {
    const full = text.trim();
    if (!full) return [];
    const sentences = new TextToLines(full)
      .build()
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line !== full);
    return [full, ...sentences];
  }

  /**
   * Semantic search over one partition's bridge records — the synthesized
   * gap-closer read path. Bridges are excluded from the fact recall path
   * (searchByText) so a synthesized inference is never attributed as a user
   * statement; this surface returns them with their evidence back-references.
   */
  async searchBridges(input: {
    memoryPartition: string;
    text: string;
    limit?: number;
  }): Promise<MemoryPoint[]> {
    try {
      const vectors = await this.embeddingService.embed([input.text], 'query');
      if (vectors.length !== 1) return [];
      return this.memoryRepository.searchBridges({
        memoryPartition: input.memoryPartition,
        vector: vectors[0],
        limit: input.limit ?? 5,
      });
    } catch {
      return [];
    }
  }

  /**
   * Semantic search over one cognition scope's conviction records — the
   * respond-time conviction probe's read path. Convictions are the AI's own
   * synthesized conclusions (never user statements) and surface with their
   * evidence back-references.
   */
  async searchConvictions(input: {
    memoryCognition: string;
    text: string;
    limit?: number;
  }): Promise<MemoryPoint[]> {
    try {
      const vectors = await this.embeddingService.embed([input.text], 'query');
      if (vectors.length !== 1) return [];
      return this.memoryRepository.searchConvictions({
        memoryCognition: input.memoryCognition,
        vector: vectors[0],
        limit: input.limit ?? 5,
      });
    } catch {
      return [];
    }
  }

  private searchRepository(
    input: Parameters<MemoryRepository['searchMemory']>[0],
  ): Promise<MemoryPoint[]> {
    return this.memoryRepository.searchMemory(input);
  }
}
