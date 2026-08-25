import { Injectable } from '@nestjs/common';
import { TextToLines } from '@triplef/helpers/text-to-lines';

import type {
  MemoryPoint,
  MemoryScopeFilters,
} from '../models/memory.model.js';

import { EmbeddingService } from './embedding.service.js';
import { MemoryRepository } from './memory.repository.js';

interface SearchInput extends MemoryScopeFilters {
  limit?: number;
  /** Blend recency into the ranking (episode probe). */
  recency?: boolean;
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
      contains: input.contains,
    });
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

  private searchRepository(
    input: Parameters<MemoryRepository['searchMemory']>[0],
  ): Promise<MemoryPoint[]> {
    return this.memoryRepository.searchMemory(input);
  }
}
