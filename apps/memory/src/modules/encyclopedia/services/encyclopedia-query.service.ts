import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  EncyclopediaDocumentInput,
  EncyclopediaDocumentResult,
  EncyclopediaSearchHit,
  EncyclopediaSearchInput,
} from '@triplef/agent/schemas';

import type { EncyclopediaChunkHit } from '../../qdrant/models/encyclopedia-chunk.model.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { ENCYCLOPEDIA_CONFIG } from '../constants/encyclopedia.constants.js';
import { mergeAdjacentChunks } from '../helpers/merge-adjacent-chunks.helper.js';
import type { EncyclopediaConfig } from '../models/encyclopedia-config.model.js';

import { mapHitToSearchHit } from './helpers/map-hit-to-search-hit.helper.js';

const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 10;
const DEFAULT_READ_CHARS = 12000;
const MAX_READ_CHARS = 48000;

/**
 * The agentic read surface of the encyclopedia — the endpoints behind the
 * harness's always-on `encyclopedia-search` / `encyclopedia-read` tools:
 * semantic search over every persisted source (fetched pages and uploaded
 * documents), and windowed document reads for the deep-dive loop.
 *
 * Distinct from EncyclopediaSelectService: selection is the ephemeral,
 * per-turn budget fill of the current turn's sources; this service is the
 * durable knowledge-base query the model drives itself. Read paths degrade
 * to empty results so a memory outage never breaks a turn (mirrors
 * MemorySearchService).
 */
@Injectable()
export class EncyclopediaQueryService {
  private readonly logger = new Logger(EncyclopediaQueryService.name);

  constructor(
    private readonly embedding: EmbeddingService,
    private readonly repository: EncyclopediaRepository,
    @Inject(ENCYCLOPEDIA_CONFIG) private readonly config: EncyclopediaConfig,
  ) {}

  /**
   * Semantic search over the whole knowledge base, optionally scoped to one
   * document (`url`) or one source (`domain`). Superseded chunks are excluded
   * by the repository. Degrades to an empty result on any failure.
   */
  async search(
    input: EncyclopediaSearchInput,
  ): Promise<EncyclopediaSearchHit[]> {
    try {
      const [vector] = await this.embedding.embed(input.query, 'query');
      if (!vector) return [];

      const must: Array<Record<string, unknown>> = [];
      if (input.url) must.push({ key: 'url', match: { value: input.url } });
      if (input.domain)
        must.push({ key: 'domain', match: { value: input.domain } });

      const hits = await this.repository.queryByFilter(
        vector,
        { must },
        Math.min(input.limit ?? DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT),
        this.config.scoreThreshold,
      );
      return hits.map(mapHitToSearchHit);
    } catch (error) {
      this.logger.warn(
        `encyclopedia search failed — degrading to empty: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  /**
   * One window into a stored document: its content chunks ordered by
   * chunkIndex, from `offset` until the char budget fills, merged verbatim
   * with the sentence overlap stripped. Null when the url is unknown —
   * the tool reports it as "document not found".
   */
  async readDocument(
    input: EncyclopediaDocumentInput,
  ): Promise<EncyclopediaDocumentResult | null> {
    try {
      const all = await this.repository.scrollByUrl(input.url);
      if (all.length === 0) return null;

      const sorted = all.sort((a, b) => a.chunkIndex - b.chunkIndex);
      const maxChars = Math.min(
        input.maxChars ?? DEFAULT_READ_CHARS,
        MAX_READ_CHARS,
      );
      const window = this.fillWindow(sorted, input.offset ?? 0, maxChars);
      if (window.length === 0) return null;

      const content = mergeAdjacentChunks(
        window.map((chunk) => ({
          url: chunk.url,
          title: chunk.title,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          score: 1,
        })),
        this.config.chunkOverlapSentences,
      )
        .map((passage) => passage.content)
        .join('\n\n');

      const fromChunk = window[0].chunkIndex;
      const toChunk = window[window.length - 1].chunkIndex;
      return {
        url: input.url,
        title: sorted[0].title,
        domain: sorted[0].domain,
        totalChunks: sorted.length,
        fromChunk,
        toChunk,
        hasMore: toChunk < sorted[sorted.length - 1].chunkIndex,
        content,
      };
    } catch (error) {
      this.logger.warn(
        `encyclopedia document read failed for ${input.url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Greedy char-budget window over the sorted chunks starting at `offset`:
   * always at least the offset chunk (it may exceed the budget alone), then
   * following chunks while they fit.
   */
  private fillWindow(
    sorted: EncyclopediaChunkHit[],
    offset: number,
    maxChars: number,
  ): EncyclopediaChunkHit[] {
    const clamped = Math.min(offset, sorted.length - 1);
    const window: EncyclopediaChunkHit[] = [];
    let chars = 0;
    for (const chunk of sorted.slice(clamped)) {
      if (window.length > 0 && chars + chunk.content.length > maxChars) break;
      window.push(chunk);
      chars += chunk.content.length;
    }
    return window;
  }
}
