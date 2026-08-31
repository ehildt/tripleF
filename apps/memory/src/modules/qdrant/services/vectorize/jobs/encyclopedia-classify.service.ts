import { Injectable, Logger } from '@nestjs/common';
import { buildEncyclopediaClassifyPrompt } from '@triplef/agent/prompts';
import { AiSdkService } from '@triplef/ai-sdk';

import { buildProviderOptions } from '../../../../ai-sdk/helpers/provider-options.helper.js';
import { EncyclopediaLedgerRepository } from '../../../../persistence/services/encyclopedia-ledger.repository.js';
import { parseEncyclopediaClassification } from '../../../helpers/parse-encyclopedia-classification.helper.js';
import type { EncyclopediaClassifyJobData } from '../../../models/memory.model.js';
import { EncyclopediaRepository } from '../../encyclopedia.repository.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import { MemoryOverridesService } from '../../memory-overrides.service.js';

/** Hard cap on pending documents processed per run (mirrors the sweep). */
const MAX_PENDING_PER_RUN = 500;
/** Content prefix fed to the classifier — enough to label, cheap to send. */
const CLASSIFY_CONTENT_CHARS = 1600;

/**
 * Encyclopedia classification job handler (vectorize queue): labels stored
 * documents with their source-agnostic category + topic (the constellation's
 * category + topic tiers). One LLM call per document; the labels fan out
 * to every chunk of the url via a payload-only setPayload.
 *
 * Two pending queues, one per tier:
 * - Tier-2 documents are ledger-driven: `classifiedAt` null marks a row
 *   pending, so legacy documents backfill naturally on the first run and a
 *   crash resumes from the oldest unclassified row.
 * - Tier-1 search-result snippets never write ledger rows — their pending
 *   signal is the missing label itself, discovered straight from Qdrant
 *   (snippet points with no category, grouped by url). Labeling a url fans
 *   out to all its points, so a newly accumulated snippet of a known url
 *   re-enters discovery and re-classifies the url (self-healing staleness).
 *
 * Failure philosophy (matches the sweep): Qdrant/Postgres errors propagate to
 * BullMQ (retry); an unparseable classification is warn + leave pending
 * (self-heals on the next run, never burns retries on a deterministic
 * failure). Rows are marked classified only after the labels land, so a
 * crash mid-run resumes cleanly.
 */
@Injectable()
export class EncyclopediaClassifyService {
  private readonly logger = new Logger(EncyclopediaClassifyService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ledger: EncyclopediaLedgerRepository,
    private readonly repository: EncyclopediaRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
  ) {}

  async execute(data: EncyclopediaClassifyJobData): Promise<void> {
    const limit = Math.min(data.limit ?? 100, MAX_PENDING_PER_RUN);
    const pending = await this.ledger.listPendingClassification(limit);

    const knownCategories = (await this.repository.facetCategories()).map(
      (entry) => entry.value,
    );
    const knownTopics = (await this.repository.facetTopics()).map(
      (entry) => entry.value,
    );

    // Dedupe by url: a superseded document can leave several ledger rows for
    // one url, but the current chunks are classified once.
    const rowsByUrl = new Map<string, typeof pending>();
    for (const row of pending) {
      const rows = rowsByUrl.get(row.url) ?? [];
      rows.push(row);
      rowsByUrl.set(row.url, rows);
    }

    let classified = 0;
    let deferred = 0;
    for (const [url, rows] of rowsByUrl) {
      const outcome = await this.classifyOne(
        url,
        rows,
        data,
        knownCategories,
        knownTopics,
      );
      if (outcome === 'classified') classified++;
      else if (outcome === 'deferred') deferred++;
    }

    // Snippet pass: tier-1 urls discovered by their missing labels.
    const snippetUrls =
      await this.repository.scrollUnclassifiedSnippetUrls(limit);
    let snippetsClassified = 0;
    let snippetsDeferred = 0;
    for (const url of snippetUrls) {
      const outcome = await this.classifySnippetUrl(
        url,
        data,
        knownCategories,
        knownTopics,
      );
      if (outcome === 'classified') snippetsClassified++;
      else if (outcome === 'deferred') snippetsDeferred++;
    }

    this.logger.log(
      `encyclopedia-classify: ${rowsByUrl.size} documents — classified ${classified}, deferred ${deferred}; ${snippetUrls.length} snippet urls — classified ${snippetsClassified}, deferred ${snippetsDeferred}${data.dryRun ? ' (dryRun)' : ''}`,
    );

    if (!data.dryRun) {
      await this.autoTriggerReflect(data.model);
      await this.autoTriggerCluster(data.model);
    }
  }

  /**
   * Auto-trigger the reflection sweep over the global encyclopedia scope after a
   * real classification run — newly classified chunks are unreflected, so the
   * friction screen picks them up. Gated by encyclopediaReflectAutoEnabled; the
   * model falls back to the classification model when no dedicated
   * reflection model is configured.
   */
  private async autoTriggerReflect(fallbackModel: string): Promise<void> {
    if (!this.overrides.getEncyclopediaReflectAutoEnabled()) return;
    await this.memoryEnqueue.enqueueReflectJob({
      lane: 'encyclopedia',
      scopeKey: 'global',
      model: this.overrides.getReflectModel() ?? fallbackModel,
      limit: this.overrides.getReflectBatchLimit(),
      maxCandidates: this.overrides.getReflectMaxCandidates(),
    });
  }

  /**
   * Auto-trigger the cluster-detection sweep over the global encyclopedia
   * scope after a real classification run — the category labels changed, so
   * the clusters re-cluster. Gated by clusterAutoEnabled; the model
   * falls back to the classification model when no dedicated cluster model
   * is configured.
   */
  private async autoTriggerCluster(fallbackModel: string): Promise<void> {
    if (!this.overrides.getClusterAutoEnabled()) return;
    await this.memoryEnqueue.enqueueClusterJob({
      lane: 'encyclopedia',
      scopeKey: 'global',
      model: this.overrides.getClusterModel() ?? fallbackModel,
      minMembers: this.overrides.getClusterMinMembers(),
    });
  }

  /** Classify one url's current chunks and fan the labels out to its rows. */
  private async classifyOne(
    url: string,
    rows: Array<{ id: string }>,
    data: EncyclopediaClassifyJobData,
    knownCategories: string[],
    knownTopics: string[],
  ): Promise<'classified' | 'deferred' | 'skipped'> {
    const chunks = await this.repository.scrollByUrl(url);
    if (chunks.length === 0) {
      // Nothing stored for this url anymore — mark classified and move on.
      if (!data.dryRun) {
        await this.ledger.markClassified(rows.map((row) => row.id));
      }
      return 'skipped';
    }

    try {
      const classification = await this.classifyDocument(
        data.model,
        knownCategories,
        knownTopics,
        chunks,
      );
      if (data.dryRun) {
        this.logger.log(
          `encyclopedia-classify [dryRun]: ${url} → ${classification.category}/${classification.topic}`,
        );
        return 'skipped';
      }
      await this.repository.setClassificationByUrl(
        url,
        classification.category,
        classification.topic,
      );
      await this.ledger.markClassified(rows.map((row) => row.id));
      return 'classified';
    } catch (error) {
      this.logger.warn(
        `encyclopedia-classify: ${url} left pending — ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 'deferred';
    }
  }

  /**
   * Classify one tier-1 snippet url from its accumulated snippets and fan the
   * labels out to every point of the url. No ledger involvement: unparseable
   * output leaves the url unlabeled, so the next run's discovery retries it.
   */
  private async classifySnippetUrl(
    url: string,
    data: EncyclopediaClassifyJobData,
    knownCategories: string[],
    knownTopics: string[],
  ): Promise<'classified' | 'deferred' | 'skipped'> {
    const snippets = await this.repository.scrollSnippetsByUrl(url);
    if (snippets.length === 0) {
      return 'skipped';
    }

    try {
      const classification = await this.classifyDocument(
        data.model,
        knownCategories,
        knownTopics,
        snippets,
      );
      if (data.dryRun) {
        this.logger.log(
          `encyclopedia-classify [dryRun]: snippet ${url} → ${classification.category}/${classification.topic}`,
        );
        return 'skipped';
      }
      await this.repository.setClassificationByUrl(
        url,
        classification.category,
        classification.topic,
      );
      return 'classified';
    } catch (error) {
      this.logger.warn(
        `encyclopedia-classify: snippet ${url} left unlabeled — ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 'deferred';
    }
  }

  /** One LLM call: title + content prefix → { category, topic }. */
  private async classifyDocument(
    model: string,
    knownCategories: string[],
    knownTopics: string[],
    chunks: Array<{ title?: string; content: string }>,
  ): Promise<{ category: string; topic: string }> {
    const title = chunks.find((chunk) => chunk.title)?.title;
    const content = chunks
      .map((chunk) => chunk.content)
      .join('\n')
      .slice(0, CLASSIFY_CONTENT_CHARS);
    const input = [title ? `TITLE: ${title}` : null, `CONTENT: ${content}`]
      .filter(Boolean)
      .join('\n');

    const { text } = await this.aiSdkService.generateChat({
      model,
      messages: [
        {
          role: 'system' as const,
          content: buildEncyclopediaClassifyPrompt(
            knownCategories,
            knownTopics,
          ),
        },
        { role: 'user' as const, content: input },
      ],
      providerOptions: buildProviderOptions({ think: false }),
      tools: {},
    });
    return parseEncyclopediaClassification(text);
  }
}
