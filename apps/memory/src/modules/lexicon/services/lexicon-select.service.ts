import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  LexiconSelectedChunk,
  LexiconSelectInput,
  LexiconSelectResult,
  LexiconSourceDocument,
} from '@triplef/agent/schemas';

import type { LexiconChunkHit } from '../../qdrant/models/lexicon-chunk.model.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { LexiconRepository } from '../../qdrant/services/lexicon.repository.js';
import { LEXICON_CONFIG } from '../constants/lexicon.constants.js';
import { chunkTextBySentences } from '../helpers/chunk-text.helper.js';
import { fillChunkBudget } from '../helpers/fill-chunk-budget.helper.js';
import {
  type AdjacentChunk,
  mergeAdjacentChunks,
} from '../helpers/merge-adjacent-chunks.helper.js';
import { cosineScores } from '../helpers/score-chunks.helper.js';
import type { LexiconConfig } from '../models/lexicon-config.model.js';

import { mapChunkWithScore } from './helpers/map-chunk-with-score.helper.js';
import { mapHitToChunk } from './helpers/map-hit-to-chunk.helper.js';
import { mapPassageToChunk } from './helpers/map-passage-to-chunk.helper.js';
import {
  LexiconStoreService,
  type PersistOutcome,
} from './lexicon-store.service.js';

/** Over-fetch multiplier for the global probe — absorbs deduped duplicates. */
const PROBE_OVERFETCH_MULTIPLIER = 4;

/**
 * Retrieval selection with a read-through persist layer: documents with a url
 * are stored (or reused by content hash) in the memory-lexicon collection,
 * then Lane A selects from the current documents and Lane B probes previously
 * persisted sources (neighbor-expanded). Nothing is ever summarized — every
 * returned passage is a verbatim span.
 */
@Injectable()
export class LexiconSelectService {
  private readonly logger = new Logger(LexiconSelectService.name);

  constructor(
    private readonly embedding: EmbeddingService,
    private readonly repository: LexiconRepository,
    private readonly store: LexiconStoreService,
    @Inject(LEXICON_CONFIG) private readonly config: LexiconConfig,
  ) {}

  async select(input: LexiconSelectInput): Promise<LexiconSelectResult> {
    if (!this.config.selectEnabled) {
      throw new ServiceUnavailableException('lexicon selection disabled');
    }

    // 1. Persist documents (read-through cache). Disabled → pure ephemeral.
    const persist = this.config.persistEnabled
      ? await this.store.persistDocuments(
          input.documents,
          input.partitionScope ?? 'global',
        )
      : {
          reusedDocs: 0,
          storedDocs: 0,
          currentUrls: [],
          indexedUrls: [],
          ephemeralDocs: input.documents,
        };

    // 1b. Tier-1 index: every search result becomes a snippet point (cheap,
    //     no page fetch) so the lexicon remembers every source touched.
    const snippetUrls = this.config.persistEnabled
      ? await this.store.indexSearchResults(
          input.searchResults ?? [],
          input.partitionScope ?? 'global',
        )
      : [];
    const currentUrls = [...persist.currentUrls, ...snippetUrls];

    // 2. Embed the query once — reused for both lanes.
    const [queryVector] = await this.embedding.embed(input.query, 'query');

    // 3. Lane A: current documents (persisted via one vector query, ephemeral
    //    via in-memory chunk + embed + cosine).
    const laneA = await this.collectLaneA(queryVector, persist);

    // 4. Sort desc, dedupe identical text (first = highest score), threshold.
    const sorted = [...laneA.chunks].sort((a, b) => b.score - a.score);
    const deduped = dedupeByContent(sorted);
    const aboveThreshold = deduped.filter(
      (chunk) => chunk.score >= this.config.scoreThreshold,
    );
    const droppedByThreshold = deduped.length - aboveThreshold.length;

    // 5. Greedy budget fill over the current-turn passages.
    const budget = input.budgetChars ?? this.config.budgetChars;
    const { selected } = fillChunkBudget(aboveThreshold, budget);

    // 6. Lane B: global probe of previously persisted sources.
    const pastChunks =
      this.config.persistEnabled && this.config.probeLimit > 0
        ? await this.probePast(queryVector, currentUrls, deduped)
        : undefined;

    this.logger.log(
      {
        queryChars: input.query.length,
        docCount: input.documents.length,
        consideredChunks: deduped.length,
        selectedChunks: selected.length,
        selectedChars: selected.reduce(
          (sum, chunk) => sum + chunk.content.length,
          0,
        ),
        pastChunks: pastChunks?.length ?? 0,
        reusedDocs: persist.reusedDocs,
        storedDocs: persist.storedDocs,
      },
      'lexicon selection complete',
    );

    return {
      chunks: selected,
      consideredChunks: deduped.length,
      selectedChunks: selected.length,
      droppedByThreshold,
      inputChunksDropped: laneA.inputChunksDropped,
      pastChunks,
      reusedDocs: persist.reusedDocs,
      storedDocs: persist.storedDocs,
    };
  }

  /** Lane A: current documents, scored against the query. */
  private async collectLaneA(
    queryVector: number[],
    persist: PersistOutcome,
  ): Promise<{ chunks: LexiconSelectedChunk[]; inputChunksDropped: number }> {
    const chunks: LexiconSelectedChunk[] = [];

    if (persist.indexedUrls.length > 0) {
      const hits = await this.repository.queryByFilter(
        queryVector,
        {
          must: [
            { key: 'url', match: { any: persist.indexedUrls } },
            // Lane A selects fetched content only — snippets are for Lane B.
            { key: 'source_type', match: { value: 'content' } },
          ],
        },
        this.config.maxChunks,
        this.config.scoreThreshold,
      );
      chunks.push(...hits.map(mapHitToChunk));
    }

    let inputChunksDropped = 0;
    if (persist.ephemeralDocs.length > 0) {
      const ephemeral = this.chunkEphemeral(persist.ephemeralDocs);
      inputChunksDropped = ephemeral.dropped;
      if (ephemeral.chunks.length > 0) {
        const vectors = await this.embedding.embed(
          ephemeral.chunks.map((chunk) => chunk.content),
          'document',
        );
        const scores = cosineScores(queryVector, vectors);
        chunks.push(
          ...ephemeral.chunks.map((chunk, index) =>
            mapChunkWithScore(chunk, index, scores),
          ),
        );
      }
    }

    return { chunks, inputChunksDropped };
  }

  /** Chunk + dedupe + round-robin cap the no-url/oversize documents. */
  private chunkEphemeral(docs: LexiconSourceDocument[]): {
    chunks: LexiconSelectedChunk[];
    dropped: number;
  } {
    const chunks: LexiconSelectedChunk[] = [];
    const seen = new Set<string>();
    for (const doc of docs) {
      for (const content of chunkTextBySentences(
        doc.content,
        this.config.chunkChars,
        this.config.chunkOverlapSentences,
      )) {
        if (seen.has(content)) continue;
        seen.add(content);
        chunks.push({ url: doc.url, title: doc.title, content, score: 0 });
      }
    }
    if (chunks.length <= this.config.maxChunks) {
      return { chunks, dropped: 0 };
    }
    return {
      chunks: roundRobinCap(chunks, this.config.maxChunks),
      dropped: chunks.length - this.config.maxChunks,
    };
  }

  /**
   * Lane B: global probe of previously persisted sources, excluding the
   * current turn's urls. Over-fetch → dedupe → top hits → neighbor expansion
   * → merge adjacent chunks into contiguous passages. Snippets (Tier-1
   * search results) surface as-is — no expansion, no merge.
   */
  private async probePast(
    queryVector: number[],
    currentUrls: string[],
    laneA: LexiconSelectedChunk[],
  ): Promise<LexiconSelectedChunk[] | undefined> {
    const filter =
      currentUrls.length > 0
        ? { must_not: [{ key: 'url', match: { any: currentUrls } }] }
        : {};
    const hits = await this.repository.queryByFilter(
      queryVector,
      filter,
      this.config.probeLimit * PROBE_OVERFETCH_MULTIPLIER,
      this.config.scoreThreshold,
    );
    if (hits.length === 0) return undefined;

    const laneAContent = new Set(laneA.map((chunk) => chunk.content));
    const fresh = hits.filter((hit) => !laneAContent.has(hit.content));
    if (fresh.length === 0) return undefined;

    const top = fresh.slice(0, this.config.probeLimit);

    // Snippets surface as-is; content chunks expand into contiguous passages.
    const snippets: LexiconSelectedChunk[] = [];
    const contentHits: LexiconChunkHit[] = [];
    for (const hit of top) {
      if (hit.sourceType === 'result') {
        snippets.push({
          url: hit.url,
          title: hit.title,
          content: hit.content,
          score: hit.score ?? 0,
          sourceType: 'result',
        });
      } else {
        contentHits.push(hit);
      }
    }

    const expanded: AdjacentChunk[] = [];
    const seen = new Set<string>();
    for (const hit of contentHits) {
      const neighbors = await this.repository.scrollNeighbors(
        hit.url,
        hit.chunkIndex,
        this.config.neighborExpansion,
      );
      for (const neighbor of neighbors) {
        const key = `${neighbor.url}|${neighbor.chunkIndex}`;
        if (seen.has(key)) continue;
        seen.add(key);
        expanded.push({
          url: neighbor.url,
          title: neighbor.title,
          chunkIndex: neighbor.chunkIndex,
          content: neighbor.content,
          score: hit.score ?? 0,
        });
      }
    }

    const passages = mergeAdjacentChunks(
      expanded,
      this.config.chunkOverlapSentences,
    ).map(mapPassageToChunk);

    return [...passages, ...snippets];
  }
}

/** Keep the first occurrence of each chunk text (input is score-sorted desc). */
function dedupeByContent(
  chunks: LexiconSelectedChunk[],
): LexiconSelectedChunk[] {
  const seen = new Set<string>();
  return chunks.filter((chunk) => {
    if (seen.has(chunk.content)) return false;
    seen.add(chunk.content);
    return true;
  });
}

/**
 * Keep at most `maxChunks` chunks, drawing round-robin from per-document
 * groups (keyed by url/title) so every source contributes before any source
 * contributes twice.
 */
function roundRobinCap(
  chunks: LexiconSelectedChunk[],
  maxChunks: number,
): LexiconSelectedChunk[] {
  const groups: LexiconSelectedChunk[][] = [];
  const groupByKey = new Map<string, LexiconSelectedChunk[]>();
  for (const chunk of chunks) {
    const key = chunk.url ?? chunk.title ?? '';
    let group = groupByKey.get(key);
    if (!group) {
      group = [];
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.push(chunk);
  }

  const capped: LexiconSelectedChunk[] = [];
  let cursor = 0;
  while (
    capped.length < maxChunks &&
    groups.some((group) => group.length > 0)
  ) {
    const group = groups[cursor % groups.length];
    const chunk = group.shift();
    if (chunk) capped.push(chunk);
    cursor++;
  }
  return capped;
}
