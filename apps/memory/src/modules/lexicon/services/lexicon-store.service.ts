import { Inject, Injectable, Logger } from '@nestjs/common';
import type { LexiconSourceDocument } from '@triplef/agent/schemas';
import { hashPayload } from '@triplef/helpers/hash-payload';

import { LexiconLedgerRepository } from '../../persistence/services/lexicon-ledger.repository.js';
import { deterministicPointId } from '../../qdrant/helpers/deterministic-point-id.helper.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { LexiconRepository } from '../../qdrant/services/lexicon.repository.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { LEXICON_CONFIG } from '../constants/lexicon.constants.js';
import { chunkTextBySentences } from '../helpers/chunk-text.helper.js';
import type { LexiconConfig } from '../models/lexicon-config.model.js';

/** Outcome of the persist pass — what the select flow needs to know. */
export interface PersistOutcome {
  reusedDocs: number;
  storedDocs: number;
  /** All current-turn urls (persisted + oversize-rejected) — Lane B exclusion. */
  currentUrls: string[];
  /** Urls present in the index — Lane A vector query filter. */
  indexedUrls: string[];
  /** Docs to chunk+embed in-memory (no url, or oversize-rejected). */
  ephemeralDocs: LexiconSourceDocument[];
}

/**
 * Read-through persist layer of the lexicon select flow: for each document
 * with a url, reuse the stored chunks when the content hash matches, else
 * chunk → embed → supersede (upsert new-hash chunks, delete old-hash chunks)
 * and write a ledger row. Documents over the oversize ceiling are REJECTED
 * from the index (never truncated) but returned for ephemeral use.
 */
@Injectable()
export class LexiconStoreService {
  private readonly logger = new Logger(LexiconStoreService.name);

  constructor(
    private readonly repository: LexiconRepository,
    private readonly ledger: LexiconLedgerRepository,
    private readonly embedding: EmbeddingService,
    private readonly memoryEnqueue: MemoryEnqueueService,
    @Inject(LEXICON_CONFIG) private readonly config: LexiconConfig,
  ) {}

  async persistDocuments(
    documents: LexiconSourceDocument[],
    partitionScope: string,
  ): Promise<PersistOutcome> {
    let reusedDocs = 0;
    let storedDocs = 0;
    const currentUrls: string[] = [];
    const indexedUrls: string[] = [];
    const ephemeralDocs: LexiconSourceDocument[] = [];
    const ledgerRows: Array<{
      url: string;
      contentHash: string;
      chunkCount: number;
      partitionScope: string;
      title?: string;
    }> = [];

    for (const doc of documents) {
      if (!doc.url) {
        ephemeralDocs.push(doc);
        continue;
      }
      currentUrls.push(doc.url);
      if (doc.content.length > this.config.maxDocumentChars) {
        ephemeralDocs.push(doc);
        continue;
      }

      const contentHash = hashPayload(doc.content);
      const existing = await this.repository.scrollByUrl(doc.url);
      if (latestHash(existing) === contentHash) {
        reusedDocs++;
        indexedUrls.push(doc.url);
        continue;
      }

      const chunks = chunkTextBySentences(
        doc.content,
        this.config.chunkChars,
        this.config.chunkOverlapSentences,
      );
      if (chunks.length === 0) {
        ephemeralDocs.push(doc);
        continue;
      }
      const vectors = await this.embedding.embed(chunks, 'document');
      const fetchedAt = new Date().toISOString();
      const domain = deriveDomain(doc.url);
      await this.repository.upsertChunks(
        chunks.map((content, index) => ({
          id: deterministicPointId(`${doc.url}|${contentHash}|${index}`),
          vector: vectors[index],
          content,
          url: doc.url,
          domain,
          title: doc.title,
          fetchedAt,
          contentHash,
          chunkIndex: index,
          chunkCount: chunks.length,
          partitionScope,
          sourceType: 'content',
        })),
      );
      await this.repository.deleteByUrlExcludingHash(doc.url, contentHash);
      ledgerRows.push({
        url: doc.url,
        contentHash,
        chunkCount: chunks.length,
        partitionScope,
        title: doc.title,
      });
      storedDocs++;
      indexedUrls.push(doc.url);
    }

    // Ledger + auto-trigger: warn-and-continue — a missing ledger row degrades
    // to no-sweep-coverage, never a failed selection.
    try {
      await this.ledger.insertMany(ledgerRows);
      if (
        (await this.ledger.countPending()) >= this.config.consolidateThreshold
      ) {
        await this.memoryEnqueue.enqueueLexiconSweep({});
      }
    } catch (error) {
      this.logger.warn(
        `Lexicon ledger write/auto-trigger skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { reusedDocs, storedDocs, currentUrls, indexedUrls, ephemeralDocs };
  }

  /**
   * Tier-1 index: store every search result as a cheap snippet point (one
   * point per result, no chunking, no link graph) so the lexicon remembers
   * every source touched — not just the pages that were fetched. Idempotent
   * by deterministic id (`url|snippetHash`); unchanged snippets overwrite in
   * place, changed snippets add a new point (historical results accumulate).
   * Returns every processed url for the Lane B exclusion set.
   */
  async indexSearchResults(
    results: Array<{ url: string; title?: string; snippet: string }>,
    partitionScope: string,
  ): Promise<string[]> {
    const toEmbed: Array<{
      url: string;
      title?: string;
      snippet: string;
      contentHash: string;
      domain: string;
    }> = [];
    for (const result of results) {
      if (!result.url || !result.snippet.trim()) continue;
      toEmbed.push({
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        contentHash: hashPayload(result.snippet),
        domain: deriveDomain(result.url),
      });
    }
    if (toEmbed.length === 0) return [];

    const vectors = await this.embedding.embed(
      toEmbed.map((entry) => entry.snippet),
      'document',
    );
    const fetchedAt = new Date().toISOString();
    await this.repository.upsertChunks(
      toEmbed.map((entry, index) => ({
        id: deterministicPointId(`${entry.url}|${entry.contentHash}`),
        vector: vectors[index],
        content: entry.snippet,
        url: entry.url,
        domain: entry.domain,
        title: entry.title,
        fetchedAt,
        contentHash: entry.contentHash,
        chunkIndex: 0,
        chunkCount: 1,
        partitionScope,
        sourceType: 'result',
      })),
      { skipLinks: true },
    );
    return toEmbed.map((entry) => entry.url);
  }
}

/** The newest content hash among a url's stored chunks (by fetched_at). */
function latestHash(
  existing: Array<{ contentHash: string; fetchedAt: string }>,
): string | undefined {
  if (existing.length === 0) return undefined;
  return existing.reduce((newest, chunk) =>
    chunk.fetchedAt > newest.fetchedAt ? chunk : newest,
  ).contentHash;
}

/** Bare hostname of a url, lowercased and www-stripped. */
function deriveDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
