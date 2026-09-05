import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EncyclopediaSourceDocument } from '@triplef/agent/schemas';
import { hashPayload } from '@triplef/helpers/hash-payload';

import { EncyclopediaLedgerRepository } from '../../persistence/services/encyclopedia-ledger.repository.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { ENCYCLOPEDIA_CONFIG } from '../constants/encyclopedia.constants.js';
import { chunkTextBySentences } from '../helpers/chunk-text.helper.js';
import type { EncyclopediaConfig } from '../models/encyclopedia-config.model.js';

import { mapContentToChunk } from './helpers/map-content-to-chunk.helper.js';
import { mapEntryToChunk } from './helpers/map-entry-to-chunk.helper.js';

/** Outcome of the persist pass — what the select flow needs to know. */
export interface PersistOutcome {
  reusedDocs: number;
  storedDocs: number;
  /** All current-turn urls (persisted + oversize-rejected) — Lane B exclusion. */
  currentUrls: string[];
  /** Urls present in the index — Lane A vector query filter. */
  indexedUrls: string[];
  /** Docs to chunk+embed in-memory (no url, or rejected). */
  ephemeralDocs: EncyclopediaSourceDocument[];
  /**
   * Docs rejected from the index with a reason (oversize, or empty after
   * chunking). In the select flow these still serve the turn in-memory
   * (ephemeralDocs); the persist-only index flow surfaces them as drops.
   */
  rejectedDocs: Array<{
    title?: string;
    url?: string;
    reason: 'oversize' | 'empty';
  }>;
}

/**
 * Read-through persist layer of the encyclopedia select flow: for each document
 * with a url, reuse the stored chunks when the content hash matches, else
 * chunk → embed → supersede (upsert new-hash chunks, delete old-hash chunks)
 * and write a ledger row. Documents over the oversize ceiling are REJECTED
 * from the index (never truncated) but returned for ephemeral use.
 */
@Injectable()
export class EncyclopediaStoreService {
  private readonly logger = new Logger(EncyclopediaStoreService.name);

  constructor(
    private readonly repository: EncyclopediaRepository,
    private readonly ledger: EncyclopediaLedgerRepository,
    private readonly embedding: EmbeddingService,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
    @Inject(ENCYCLOPEDIA_CONFIG) private readonly config: EncyclopediaConfig,
  ) {}

  async persistDocuments(
    documents: EncyclopediaSourceDocument[],
    partitionScope: string,
    model?: string,
    allowUrlless = false,
  ): Promise<PersistOutcome> {
    let reusedDocs = 0;
    let storedDocs = 0;
    const currentUrls: string[] = [];
    const indexedUrls: string[] = [];
    const ephemeralDocs: EncyclopediaSourceDocument[] = [];
    const rejectedDocs: Array<{
      title?: string;
      url?: string;
      reason: 'oversize' | 'empty';
    }> = [];
    const ledgerRows: Array<{
      url: string;
      contentHash: string;
      chunkCount: number;
      partitionScope: string;
      title?: string;
    }> = [];

    for (const doc of documents) {
      const contentHash = hashPayload(doc.content);
      // Url-less documents are ephemeral in the select flow (one-off tool
      // payloads), but the index endpoint persists them under a synthetic
      // `upload:<contentHash>` url so the url-keyed supersede/classify sweeps
      // still find them. Unchanged re-upload overwrites in place; a changed
      // upload accumulates as new points (no stable identity to supersede by).
      const url =
        doc.url ?? (allowUrlless ? `upload:${contentHash}` : undefined);
      if (!url) {
        ephemeralDocs.push(doc);
        continue;
      }
      currentUrls.push(url);
      if (doc.content.length > this.config.maxDocumentChars) {
        ephemeralDocs.push(doc);
        rejectedDocs.push({ title: doc.title, url, reason: 'oversize' });
        continue;
      }

      const existing = await this.repository.scrollByUrl(url);
      if (latestHash(existing) === contentHash) {
        reusedDocs++;
        indexedUrls.push(url);
        continue;
      }

      // Blank content chunks to nothing — the sentence splitter throws on a
      // truly empty string, so guard first to keep one bad upload from
      // failing the whole batch.
      const chunks = doc.content.trim()
        ? chunkTextBySentences(
            doc.content,
            this.config.chunkChars,
            this.config.chunkOverlapSentences,
          )
        : [];
      if (chunks.length === 0) {
        ephemeralDocs.push(doc);
        rejectedDocs.push({ title: doc.title, url, reason: 'empty' });
        continue;
      }
      const vectors = await this.embedding.embed(chunks, 'document');
      const fetchedAt = new Date().toISOString();
      const domain = deriveDomain(url);
      await this.repository.upsertChunks(
        chunks.map((content, index) =>
          mapContentToChunk(
            content,
            index,
            vectors,
            { ...doc, url },
            domain,
            fetchedAt,
            contentHash,
            chunks.length,
            partitionScope,
          ),
        ),
      );
      await this.repository.deleteByUrlExcludingHash(url, contentHash);
      ledgerRows.push({
        url,
        contentHash,
        chunkCount: chunks.length,
        partitionScope,
        title: doc.title,
      });
      storedDocs++;
      indexedUrls.push(url);
    }

    // Ledger + auto-trigger: warn-and-continue — a missing ledger row degrades
    // to no-sweep-coverage, never a failed selection.
    await this.writeLedgerAndAutoTrigger(ledgerRows, model);

    return {
      reusedDocs,
      storedDocs,
      currentUrls,
      indexedUrls,
      ephemeralDocs,
      rejectedDocs,
    };
  }

  /**
   * Append the ledger rows, then auto-trigger the supersede sweep and the
   * classification job when their pending thresholds are crossed. Warn-and-
   * continue: a missing ledger row degrades to no-sweep-coverage, never a
   * failed selection.
   */
  private async writeLedgerAndAutoTrigger(
    ledgerRows: Array<{
      url: string;
      contentHash: string;
      chunkCount: number;
      partitionScope: string;
      title?: string;
    }>,
    model?: string,
  ): Promise<void> {
    try {
      await this.ledger.insertMany(ledgerRows);
      if (
        (await this.ledger.countPending()) >= this.config.consolidateThreshold
      ) {
        await this.memoryEnqueue.enqueueEncyclopediaSweep({});
      }
      if (
        (await this.ledger.countPendingClassification()) >=
        this.config.classifyThreshold
      ) {
        await this.enqueueClassify(model);
      }
    } catch (error) {
      this.logger.warn(
        `Encyclopedia ledger write/auto-trigger skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Tier-1 index: store every search result as a cheap snippet point (one
   * point per result, no chunking, no link graph) so the encyclopedia remembers
   * every source touched — not just the pages that were fetched. Idempotent
   * by deterministic id (`url|snippetHash`); unchanged snippets overwrite in
   * place, changed snippets add a new point (historical results accumulate).
   * Returns every processed url for the Lane B exclusion set.
   */
  async indexSearchResults(
    results: Array<{ url: string; title?: string; snippet: string }>,
    partitionScope: string,
    model?: string,
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
      toEmbed.map((entry, index) =>
        mapEntryToChunk(entry, index, vectors, fetchedAt, partitionScope),
      ),
      { skipLinks: true },
    );

    // Tier-1 snippets write no ledger rows — their classification queue is
    // Qdrant-side label discovery, so every indexed search gives the classify
    // job a chance to label the newly touched urls (deduped job id, and the
    // job no-ops on a fully labeled encyclopedia). Warn-and-continue, same
    // as the ledger path: a missed trigger degrades to stale grouping, never
    // a failed selection.
    try {
      await this.enqueueClassify(model);
    } catch (error) {
      this.logger.warn(
        `encyclopedia classify auto-trigger skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return toEmbed.map((entry) => entry.url);
  }

  /**
   * Enqueue the encyclopedia classification job with the best available model:
   * the turn's model (threaded from the select call) wins over the client
   * override, which wins over the env baseline — so classification runs
   * without a dedicated model config.
   */
  private async enqueueClassify(model?: string): Promise<void> {
    const classifyModel =
      model ?? this.overrides.getClassifyModel() ?? this.config.classifyModel;
    if (!classifyModel) {
      this.logger.warn(
        'encyclopedia classify auto-trigger skipped: no model (pass one, set a client override, or set ENCYCLOPEDIA_CLASSIFY_MODEL)',
      );
      return;
    }
    await this.memoryEnqueue.enqueueEncyclopediaClassify({
      model: classifyModel,
    });
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
