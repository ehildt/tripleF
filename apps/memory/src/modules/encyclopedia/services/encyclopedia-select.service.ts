import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  EncyclopediaSelectedChunk,
  EncyclopediaSelectInput,
  EncyclopediaSelectResult,
  EncyclopediaSourceDocument,
} from '@triplef/agent/schemas';

import type { EncyclopediaChunkHit } from '../../qdrant/models/encyclopedia-chunk.model.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { ENCYCLOPEDIA_CONFIG } from '../constants/encyclopedia.constants.js';
import {
  chunkTextBySections,
  chunkTextBySentences,
} from '../helpers/chunk-text.helper.js';
import { fillChunkBudget } from '../helpers/fill-chunk-budget.helper.js';
import { fuseByRank } from '../helpers/fuse-by-rank.helper.js';
import {
  type AdjacentChunk,
  mergeAdjacentChunks,
} from '../helpers/merge-adjacent-chunks.helper.js';
import { cosineScores } from '../helpers/score-chunks.helper.js';
import type { EncyclopediaConfig } from '../models/encyclopedia-config.model.js';

import { mapChunkWithScore } from './helpers/map-chunk-with-score.helper.js';
import { mapHitToChunk } from './helpers/map-hit-to-chunk.helper.js';
import { mapPassageToChunk } from './helpers/map-passage-to-chunk.helper.js';
import { roundRobinCap } from './helpers/round-robin-cap.helper.js';
import { EncyclopediaIngestTriageService } from './encyclopedia-ingest-triage.service.js';
import type { IngestTriageOutcome } from './encyclopedia-ingest-triage.service.types.js';
import { EncyclopediaStoreService } from './encyclopedia-store.service.js';
import type { PersistOutcome } from './encyclopedia-store.service.types.js';

/** Over-fetch multiplier for the global probe — absorbs deduped duplicates. */
const PROBE_OVERFETCH_MULTIPLIER = 4;

/**
 * Retrieval selection with a read-through persist layer: documents with a url
 * are stored (or reused by content hash) in the memory-encyclopedia collection,
 * then Lane A selects from the current documents and Lane B probes previously
 * persisted sources (neighbor-expanded). Nothing is ever summarized — every
 * returned passage is a verbatim span.
 */
/** Ephemeral chunking outcome: kept chunks plus the dedupe drop count. */
interface EncyclopediaEphemeralChunks {
  /** Chunks that survived dedupe and the round-robin cap. */
  chunks: EncyclopediaSelectedChunk[];
  /** Chunks dropped as duplicates. */
  dropped: number;
}

@Injectable()
export class EncyclopediaSelectService {
  private readonly logger = new Logger(EncyclopediaSelectService.name);

  constructor(
    private readonly embedding: EmbeddingService,
    private readonly repository: EncyclopediaRepository,
    private readonly store: EncyclopediaStoreService,
    private readonly ingestTriage: EncyclopediaIngestTriageService,
    private readonly overrides: MemoryOverridesService,
    @Inject(ENCYCLOPEDIA_CONFIG) private readonly config: EncyclopediaConfig,
  ) {}

  async select(
    input: EncyclopediaSelectInput,
  ): Promise<EncyclopediaSelectResult> {
    if (!this.config.selectEnabled) {
      throw new ServiceUnavailableException('encyclopedia selection disabled');
    }

    // 0. Ingest triage: strip off-topic content before anything is persisted.
    //    Dropped documents stay ephemeral for the live turn (the answer never
    //    loses sources) but are never written to the encyclopedia.
    const triage = await this.triageForIngest(input);

    // 1. Persist documents (read-through cache). Disabled → pure ephemeral.
    const persist = this.config.persistEnabled
      ? await this.store.persistDocuments(
          triage.documents,
          input.partitionScope ?? 'global',
          input.model,
        )
      : {
          reusedDocs: 0,
          storedDocs: 0,
          currentUrls: [],
          indexedUrls: [],
          ephemeralDocs: input.documents,
          rejectedDocs: [],
        };
    if (triage.droppedDocuments.length > 0) {
      persist.ephemeralDocs = [
        ...persist.ephemeralDocs,
        ...triage.droppedDocuments,
      ];
    }

    // 1b. Tier-1 index: every kept search result becomes a snippet point
    //     (cheap, no page fetch) so the encyclopedia remembers the sources
    //     that proved on-topic.
    const snippetUrls = this.config.persistEnabled
      ? await this.store.indexSearchResults(
          triage.searchResults,
          input.partitionScope ?? 'global',
          input.model,
        )
      : [];
    const currentUrls = [...persist.currentUrls, ...snippetUrls];

    // 2. Embed the query once — reused for both lanes.
    const [queryVector] = await this.embedding.embed(input.query, 'query');

    // 3. Lane A: current documents (persisted via one vector query, ephemeral
    //    via in-memory chunk + embed + cosine).
    const laneA = await this.collectLaneA(queryVector, input.query, persist);

    // 4. Threshold the cosine-scored ephemeral chunks (persisted chunks were
    //    thresholded server-side by the dense leg), then rank-fuse both
    //    lists — their score scales are incomparable, only rank order merges.
    const aboveThreshold = laneA.ephemeralChunks.filter(
      (chunk) => chunk.score >= this.config.scoreThreshold,
    );
    const droppedByThreshold =
      laneA.ephemeralChunks.length - aboveThreshold.length;
    const fused = fuseByRank([laneA.persistedChunks, aboveThreshold]);

    // 5. Greedy budget fill over the fused passages.
    const budget = input.budgetChars ?? this.config.budgetChars;
    const { selected } = fillChunkBudget(fused, budget);

    // 6. Lane B: global probe of previously persisted sources.
    const pastChunks =
      this.config.persistEnabled && this.config.probeLimit > 0
        ? await this.probePast(queryVector, input.query, currentUrls, fused)
        : undefined;

    this.logger.log(
      {
        queryChars: input.query.length,
        docCount: input.documents.length,
        consideredChunks: fused.length,
        selectedChunks: selected.length,
        selectedChars: selected.reduce(
          (sum, chunk) => sum + chunk.content.length,
          0,
        ),
        pastChunks: pastChunks?.length ?? 0,
        reusedDocs: persist.reusedDocs,
        storedDocs: persist.storedDocs,
      },
      'encyclopedia selection complete',
    );

    return {
      chunks: selected,
      consideredChunks: fused.length,
      selectedChunks: selected.length,
      droppedByThreshold,
      inputChunksDropped: laneA.inputChunksDropped,
      pastChunks,
      reusedDocs: persist.reusedDocs,
      storedDocs: persist.storedDocs,
    };
  }

  /**
   * Ingest triage: when persistence and the triage are both enabled, ask the
   * model to strip off-topic candidates before anything is written. Disabled
   * → everything passes through unchanged (the caller's explicit opt-out).
   */
  private async triageForIngest(
    input: EncyclopediaSelectInput,
  ): Promise<IngestTriageOutcome> {
    if (!this.config.persistEnabled || !this.config.ingestTriageEnabled) {
      return {
        documents: input.documents,
        searchResults: input.searchResults ?? [],
        droppedDocuments: [],
      };
    }
    return this.ingestTriage.filter({
      topic: input.query,
      documents: input.documents,
      searchResults: input.searchResults ?? [],
      model: input.model,
    });
  }

  /** Lane A: current documents, scored against the query. */
  private async collectLaneA(
    queryVector: number[],
    queryText: string,
    persist: PersistOutcome,
  ): Promise<{
    persistedChunks: EncyclopediaSelectedChunk[];
    ephemeralChunks: EncyclopediaSelectedChunk[];
    inputChunksDropped: number;
  }> {
    const persistedChunks: EncyclopediaSelectedChunk[] = [];
    const ephemeralChunks: EncyclopediaSelectedChunk[] = [];

    if (persist.indexedUrls.length > 0) {
      const hits = await this.repository.queryByFilter(
        queryVector,
        queryText,
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
      persistedChunks.push(...hits.map(mapHitToChunk));
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
        ephemeralChunks.push(
          ...ephemeral.chunks.map((chunk, index) =>
            mapChunkWithScore(chunk, index, scores),
          ),
        );
      }
    }

    return { persistedChunks, ephemeralChunks, inputChunksDropped };
  }

  /** Chunk + dedupe + round-robin cap the no-url/oversize documents. */
  private chunkEphemeral(
    docs: EncyclopediaSourceDocument[],
  ): EncyclopediaEphemeralChunks {
    const chunks: EncyclopediaSelectedChunk[] = [];
    const seen = new Set<string>();
    for (const doc of docs) {
      for (const content of this.config.chunkByHeadings
        ? chunkTextBySections(
            doc.content,
            this.config.chunkChars,
            this.config.chunkOverlapSentences,
            this.config.maxHeadingDepth,
          )
        : chunkTextBySentences(
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
    queryText: string,
    currentUrls: string[],
    laneA: EncyclopediaSelectedChunk[],
  ): Promise<EncyclopediaSelectedChunk[] | undefined> {
    const filter =
      currentUrls.length > 0
        ? { must_not: [{ key: 'url', match: { any: currentUrls } }] }
        : {};
    const hits = await this.repository.queryByFilter(
      queryVector,
      queryText,
      filter,
      this.config.probeLimit * PROBE_OVERFETCH_MULTIPLIER,
      this.config.scoreThreshold,
    );
    if (hits.length === 0) return undefined;

    const laneAContent = new Set(laneA.map((chunk) => chunk.content));
    const fresh = hits.filter((hit) => !laneAContent.has(hit.content));
    if (fresh.length === 0) return undefined;

    const top = fresh.slice(0, this.config.probeLimit);

    // Heat tracking (fire-and-forget): the probe's surfaced chunks count as
    // retrievals — Lane A (the turn's own documents) does not.
    if (this.overrides.getHeatTrackingEnabled()) {
      void this.repository.incrementHeat(top).catch((error) => {
        this.logger.warn(
          `Heat write failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }

    // Snippets surface as-is; content chunks expand into contiguous passages.
    const snippets: EncyclopediaSelectedChunk[] = [];
    const contentHits: EncyclopediaChunkHit[] = [];
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
