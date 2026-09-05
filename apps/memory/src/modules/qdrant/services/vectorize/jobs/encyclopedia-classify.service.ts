import { Injectable, Logger } from '@nestjs/common';
import { buildEncyclopediaClassifyPrompt } from '@triplef/agent/prompts';
import { createMemoryTaxonomyProbeTool } from '@triplef/agent/tools';
import { AiSdkService } from '@triplef/ai-sdk';

import { buildProviderOptions } from '../../../../ollama/helpers/provider-options.helper.js';
import { EncyclopediaLedgerRepository } from '../../../../persistence/services/encyclopedia-ledger.repository.js';
import { parseEncyclopediaClassification } from '../../../helpers/parse-encyclopedia-classification.helper.js';
import type { EncyclopediaClassifyJobData } from '../../../models/memory.model.js';
import { EncyclopediaRepository } from '../../encyclopedia.repository.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import { MemoryOverridesService } from '../../memory-overrides.service.js';
import { TaxonomyProbeService } from '../../taxonomy-probe.service.js';
import { TaxonomyResolutionService } from '../../taxonomy-resolution.service.js';

/** Hard cap on pending documents processed per run (mirrors the sweep). */
const MAX_PENDING_PER_RUN = 500;
/** Content prefix fed to the classifier — enough to label, cheap to send. */
const CLASSIFY_CONTENT_CHARS = 1600;
/** Probe steps a classification may take before answering (cluster → community → hub, with slack). */
const CLASSIFY_MAX_STEPS = 5;

/**
 * Encyclopedia classification job handler (vectorize queue): labels stored
 * documents with their source-agnostic cluster/community/hub labels (the
 * constellation's taxonomy tiers). One tool-loop call per document — the
 * model probes the macro-taxonomy top-down (memory-taxonomy-probe) and
 * adopts existing nodes VERBATIM or mints phrasing-compliant new ones —
 * then the labels fan out to every chunk of the url via a payload-only
 * setPayload, after the deterministic taxonomy snap (exact → alias → fuzzy →
 * mint) guarantees the stored wording is the registry's canonical label.
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
    private readonly taxonomyResolution: TaxonomyResolutionService,
    private readonly taxonomyProbe: TaxonomyProbeService,
  ) {}

  async execute(data: EncyclopediaClassifyJobData): Promise<void> {
    const limit = Math.min(data.limit ?? 100, MAX_PENDING_PER_RUN);
    const pending = await this.ledger.listPendingClassification(limit);

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
      const outcome = await this.classifyOne(url, rows, data);
      if (outcome === 'classified') classified++;
      else if (outcome === 'deferred') deferred++;
    }

    // Snippet pass: tier-1 urls discovered by their missing labels.
    const snippetUrls =
      await this.repository.scrollUnclassifiedSnippetUrls(limit);
    let snippetsClassified = 0;
    let snippetsDeferred = 0;
    for (const url of snippetUrls) {
      const outcome = await this.classifySnippetUrl(url, data);
      if (outcome === 'classified') snippetsClassified++;
      else if (outcome === 'deferred') snippetsDeferred++;
    }

    this.logger.log(
      `encyclopedia-classify: ${rowsByUrl.size} documents — classified ${classified}, deferred ${deferred}; ${snippetUrls.length} snippet urls — classified ${snippetsClassified}, snippets deferred ${snippetsDeferred}${data.dryRun ? ' (dryRun)' : ''}`,
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
      const classification = await this.classifyDocument(data.model, chunks);
      if (data.dryRun) {
        this.logger.log(
          `encyclopedia-classify [dryRun]: ${url} → ${classification.category}/${classification.community ?? '-'}/${classification.topic}`,
        );
        return 'skipped';
      }
      // Taxonomy snap (exact → alias → fuzzy → mint) — the registry's
      // canonical labels are what lands on the chunks. Resolution writes
      // (mint/aliases), so it stays behind the dryRun guard.
      const resolved = await this.resolveClassification(classification);
      await this.repository.setClassificationByUrl(
        url,
        resolved.category,
        resolved.topic,
        resolved.community,
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
  ): Promise<'classified' | 'deferred' | 'skipped'> {
    const snippets = await this.repository.scrollSnippetsByUrl(url);
    if (snippets.length === 0) {
      return 'skipped';
    }

    try {
      const classification = await this.classifyDocument(data.model, snippets);
      if (data.dryRun) {
        this.logger.log(
          `encyclopedia-classify [dryRun]: snippet ${url} → ${classification.category}/${classification.community ?? '-'}/${classification.topic}`,
        );
        return 'skipped';
      }
      // Taxonomy snap (exact → alias → fuzzy → mint), mirroring classifyOne.
      const resolved = await this.resolveClassification(classification);
      await this.repository.setClassificationByUrl(
        url,
        resolved.category,
        resolved.topic,
        resolved.community,
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

  /**
   * Snap a parsed classification to the canonical registry labels and apply
   * the model's icon hint to the deepest newly minted node (when valid).
   */
  private async resolveClassification(classification: {
    category: string;
    topic: string;
    community?: string;
    icon?: string;
  }): Promise<{ category: string; community?: string; topic: string }> {
    const resolved = await this.taxonomyResolution.resolveLabels(
      'encyclopedia',
      'global',
      [
        { kind: 'cluster', label: classification.category },
        ...(classification.community
          ? [
              {
                kind: 'community' as const,
                label: classification.community,
                parentRef: classification.category,
              },
            ]
          : []),
        {
          kind: 'hub',
          label: classification.topic,
          parentRef: classification.community ?? classification.category,
        },
      ],
    );
    await this.taxonomyResolution.applyIconHint(classification.icon, resolved);
    const canonical = new Map(
      resolved.map((entry) => [`${entry.kind}|${entry.input}`, entry.name]),
    );
    return {
      category:
        canonical.get(`cluster|${classification.category}`) ??
        classification.category,
      community: classification.community
        ? (canonical.get(`community|${classification.community}`) ??
          classification.community)
        : undefined,
      topic:
        canonical.get(`hub|${classification.topic}`) ?? classification.topic,
    };
  }

  /**
   * One tool-loop call per document: the model may probe the macro-taxonomy
   * (memory-taxonomy-probe, top-down cluster → community → hub) before
   * answering with the { category, community?, topic, icon? } JSON. The
   * prompt's vocabulary section carries only the labels ranked closest to
   * this document — never the full dump.
   */
  private async classifyDocument(
    model: string,
    chunks: Array<{ title?: string; content: string }>,
  ): Promise<{
    category: string;
    topic: string;
    community?: string;
    icon?: string;
  }> {
    const title = chunks.find((chunk) => chunk.title)?.title;
    const content = chunks
      .map((chunk) => chunk.content)
      .join('\n')
      .slice(0, CLASSIFY_CONTENT_CHARS);
    const input = [title ? `TITLE: ${title}` : null, `CONTENT: ${content}`]
      .filter(Boolean)
      .join('\n');

    const vocabulary = await this.taxonomyProbe.rankVocabulary(
      'encyclopedia',
      'global',
      input,
    );
    const taxonomyProbeTool = createMemoryTaxonomyProbeTool({
      probe: (probeInput) =>
        this.taxonomyProbe.probe('encyclopedia', 'global', probeInput),
    });

    const { text } = await this.aiSdkService.generateWithTools({
      model,
      messages: [
        {
          role: 'system' as const,
          content: buildEncyclopediaClassifyPrompt(vocabulary),
        },
        { role: 'user' as const, content: input },
      ],
      tools: { 'memory-taxonomy-probe': taxonomyProbeTool } as any,
      // Zero probes is a correct outcome — adoption hints already sit in the
      // prompt's ranked vocabulary; the boundary snap backstops the rest.
      toolChoice: 'auto',
      maxSteps: CLASSIFY_MAX_STEPS,
      providerOptions: buildProviderOptions({ think: false }),
    });
    return parseEncyclopediaClassification(text);
  }
}
