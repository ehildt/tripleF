import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildResearchFrictionQueryPrompt,
  buildResearchTriagePrompt,
  RESEARCH_FRICTION_QUERY_INSTRUCTIONS,
  RESEARCH_TRIAGE_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import {
  ResearchFrictionQuerySchema,
  ResearchTriageSchema,
} from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { EncyclopediaStoreService } from '../../encyclopedia/services/encyclopedia-store.service.js';
import { OllamaConfigService } from '../../ollama/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../ollama/helpers/provider-options.helper.js';
import {
  type MemoryFrictionRecord,
  MemoryFrictionRepository,
} from '../../persistence/services/memory-friction.repository.js';
import type { EncyclopediaResearchJobData } from '../../qdrant/models/memory.model.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { RESEARCH_CONFIG } from '../constants/research.constants.js';
import type { ResearchConfig } from '../models/research-config.model.js';

import {
  ResearchProviderService,
  type ResearchSearchResult,
} from './research-provider.service.js';

/** One gap candidate: a search result seen but never fetched. */
interface GapCandidate {
  url: string;
  title?: string;
  snippet: string;
  partitionScope?: string;
}

/**
 * The gap-filling maintenance researcher: closes knowledge-base gaps the
 * user's own searches left behind (search results indexed as snippets but
 * never fetched), then follows the topics those pages reference — one
 * deep-dive per depth, capped at `maxDepth` (default 3) so a chain X→Y→Z
 * stops hard instead of crawling forever.
 *
 * Off by default (RESEARCH_ENABLED=false); every knob is settings-overridable.
 * Read paths degrade to empty, fetch/search failures skip the gap — a
 * research run never breaks the queue, it just closes fewer gaps.
 */
@Injectable()
export class ResearchJobService {
  private readonly logger = new Logger(ResearchJobService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly provider: ResearchProviderService,
    private readonly store: EncyclopediaStoreService,
    private readonly repository: EncyclopediaRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly frictions: MemoryFrictionRepository,
    private readonly enqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
    @Inject(RESEARCH_CONFIG) private readonly config: ResearchConfig,
  ) {}

  async execute(data: EncyclopediaResearchJobData): Promise<void> {
    if (!this.overrides.getResearchEnabled()) return;
    const model =
      data.model ?? this.overrides.getResearchModel() ?? this.config.model;
    if (!model) {
      this.logger.warn('encyclopedia research skipped: no model');
      return;
    }

    const searchEnabled = this.overrides.getResearchSearchEnabled();
    const gapLimit = data.limit ?? this.overrides.getResearchGapLimit();
    const maxDepth = this.overrides.getResearchMaxDepth();
    const fetchBudget = this.overrides.getResearchFetchBudget();
    const depth = data.depth ?? 0;
    const visited = new Set(data.visitedUrls ?? []);

    // 1. Resolve this run's gap candidates: follow-up search queries (depth
    //    ≥1) or the unfetched-snippet sweep plus the contested-memory pass
    //    (open frictions a web search could settle) at the root.
    const gaps = data.searchQueries?.length
      ? await this.searchGaps(data.searchQueries, data.partitionScope, model)
      : await this.detectGaps(gapLimit);
    if (!data.searchQueries?.length && searchEnabled) {
      const queries = await this.frictionQueries(
        model,
        this.overrides.getResearchFrictionLimit(),
      );
      if (queries.length > 0) {
        const seen = new Set(gaps.map((gap) => gap.url));
        const frictionGaps = await this.searchGaps(
          queries,
          data.partitionScope,
          model,
        );
        gaps.push(...frictionGaps.filter((gap) => !seen.has(gap.url)));
      }
    }
    if (gaps.length === 0) {
      this.logger.log(`encyclopedia research depth ${depth}: no gaps`);
      return;
    }

    // 2. Triage (one batched LLM call) → approved fetches + follow-up topics.
    const triage = await this.triage(model, gaps);
    const gapByUrl = new Map(gaps.map((gap) => [gap.url, gap]));
    const approved = triage.decisions.filter(
      (decision) => decision.close && gapByUrl.has(decision.url),
    );

    // 3. Fetch + persist approved gaps (budget + visited guards).
    const fetchedUrls = await this.closeGaps(
      approved,
      gapByUrl,
      fetchBudget,
      visited,
      model,
      data.dryRun === true,
    );

    // 4. Follow-up topics → next depth (search enabled + depth < maxDepth).
    const followUps = triage.decisions.flatMap(
      (decision) => decision.followUpTopics ?? [],
    );
    if (
      followUps.length > 0 &&
      searchEnabled &&
      depth < maxDepth &&
      !data.dryRun
    ) {
      await this.enqueue.enqueueResearchJob({
        model,
        searchQueries: followUps.slice(0, 3),
        depth: depth + 1,
        chainId: data.chainId ?? randomUUID(),
        visitedUrls: [...visited],
        partitionScope: data.partitionScope,
        dryRun: data.dryRun,
      });
    }

    this.logger.log(
      `encyclopedia research depth ${depth}: ${fetchedUrls.length} fetched, ${followUps.length} follow-ups`,
    );
  }

  /** Fetch + persist the approved gaps; a failed fetch/persist skips the gap. */
  private async closeGaps(
    approved: Array<{ url: string }>,
    gapByUrl: Map<string, GapCandidate>,
    fetchBudget: number,
    visited: Set<string>,
    model: string,
    dryRun: boolean,
  ): Promise<string[]> {
    const fetchedUrls: string[] = [];
    for (const decision of approved) {
      if (fetchedUrls.length >= fetchBudget) break;
      if (visited.has(decision.url)) continue;
      const gap = gapByUrl.get(decision.url)!;
      try {
        const page = await this.provider.fetch(decision.url);
        if (!page.content.trim()) continue;
        if (!dryRun) {
          await this.store.persistDocuments(
            [{ url: decision.url, title: gap.title, content: page.content }],
            gap.partitionScope ?? 'global',
            model,
          );
        }
        visited.add(decision.url);
        fetchedUrls.push(decision.url);
      } catch (error) {
        this.logger.warn(
          `encyclopedia research fetch/persist failed for ${decision.url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    return fetchedUrls;
  }

  /** Root sweep: snippet urls with no content chunks — the never-fetched gaps. */
  private async detectGaps(limit: number): Promise<GapCandidate[]> {
    return this.repository.scrollUnfetchedSnippetUrls(limit);
  }

  /**
   * Contested-memory pass: open frictions (encyclopedia + partition lanes)
   * become resolution-seeking search queries. One batched LLM call decides
   * which disputes a web search can settle — subjective pairs are declined
   * and stay with the reflection cycle. The fetched evidence lands in the
   * global encyclopedia; reflection, not this job, settles the friction.
   * Empty on any failure (the run just closes snippet gaps).
   */
  private async frictionQueries(
    model: string,
    limit: number,
  ): Promise<string[]> {
    try {
      const frictions = await this.frictions.listOpen(
        ['encyclopedia', 'partition'],
        limit,
      );
      if (frictions.length === 0) return [];
      const texts = await this.loadFrictionTexts(frictions);
      const contests = frictions.flatMap((friction) => {
        const pair = texts.get(friction.id);
        return pair
          ? [
              {
                id: friction.id,
                statementA: pair.a,
                statementB: pair.b,
                reason: friction.reason,
              },
            ]
          : [];
      });
      if (contests.length === 0) return [];
      const { text } = await this.aiSdkService.generateChat({
        model,
        messages: [
          { role: 'system', content: RESEARCH_FRICTION_QUERY_INSTRUCTIONS },
          {
            role: 'user',
            content: buildResearchFrictionQueryPrompt(contests),
          },
        ],
        providerOptions: buildProviderOptions({
          think: false,
          keepAlive: this.ollamaConfigService.config.keepAlive,
        }),
        tools: {},
      });
      if (!text?.trim()) return [];
      const parsed = ResearchFrictionQuerySchema.safeParse(parseLlmJson(text));
      if (!parsed.success) return [];
      const known = new Set(contests.map((contest) => contest.id));
      return [
        ...new Set(
          parsed.data.decisions
            .filter(
              (decision) =>
                decision.checkable &&
                typeof decision.query === 'string' &&
                known.has(decision.id),
            )
            .map((decision) => decision.query!.trim())
            .filter((query) => query.length > 0),
        ),
      ].slice(0, limit);
    } catch (error) {
      this.logger.warn(
        `encyclopedia research friction queries failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  /**
   * Resolve each friction's pair of statement texts from the lane's own
   * store (encyclopedia chunks vs. partition facts) — frictions whose points
   * are gone or textless drop out.
   */
  private async loadFrictionTexts(
    frictions: MemoryFrictionRecord[],
  ): Promise<Map<string, { a: string; b: string }>> {
    const byLane = new Map<string, string[]>();
    for (const friction of frictions) {
      const ids = byLane.get(friction.lane) ?? [];
      ids.push(friction.source, friction.target);
      byLane.set(friction.lane, ids);
    }
    const textById = new Map<string, string>();
    const partitionIds = byLane.get('partition');
    if (partitionIds?.length) {
      const texts = await this.memoryRepository.getTextsByIds(partitionIds);
      for (const [id, text] of texts) textById.set(id, text);
    }
    const encyclopediaIds = byLane.get('encyclopedia');
    if (encyclopediaIds?.length) {
      const texts = await this.repository.getContentsByIds(encyclopediaIds);
      for (const [id, text] of texts) textById.set(id, text);
    }
    const pairs = new Map<string, { a: string; b: string }>();
    for (const friction of frictions) {
      const a = textById.get(friction.source);
      const b = textById.get(friction.target);
      if (a && b) pairs.set(friction.id, { a, b });
    }
    return pairs;
  }

  /**
   * Follow-up pass: search each topic, index the results as snippets (they
   * become the next run's gap candidates), and return them for this run's
   * triage + fetch.
   */
  private async searchGaps(
    queries: string[],
    partitionScope: string | undefined,
    model: string,
  ): Promise<GapCandidate[]> {
    const results: ResearchSearchResult[] = [];
    for (const query of queries) {
      try {
        const hits = await this.provider.search(query);
        results.push(...hits);
      } catch (error) {
        this.logger.warn(
          `encyclopedia research search failed for "${query}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    if (results.length === 0) return [];
    await this.store.indexSearchResults(
      results.map((entry) => ({
        url: entry.url,
        title: entry.title,
        snippet: entry.snippet,
      })),
      partitionScope ?? 'global',
      model,
    );
    return results.map((entry) => ({
      url: entry.url,
      title: entry.title,
      snippet: entry.snippet,
      partitionScope,
    }));
  }

  /** One batched triage call; empty decisions on any failure (skip the run). */
  private async triage(
    model: string,
    gaps: GapCandidate[],
  ): Promise<{
    decisions: Array<{
      url: string;
      close: boolean;
      followUpTopics?: string[];
    }>;
  }> {
    try {
      const { text } = await this.aiSdkService.generateChat({
        model,
        messages: [
          { role: 'system', content: RESEARCH_TRIAGE_INSTRUCTIONS },
          {
            role: 'user',
            content: buildResearchTriagePrompt(
              gaps.map((gap) => ({
                url: gap.url,
                title: gap.title,
                snippet: gap.snippet,
              })),
            ),
          },
        ],
        providerOptions: buildProviderOptions({
          think: false,
          keepAlive: this.ollamaConfigService.config.keepAlive,
        }),
        tools: {},
      });
      if (!text?.trim()) return { decisions: [] };
      const parsed = ResearchTriageSchema.safeParse(parseLlmJson(text));
      if (!parsed.success) return { decisions: [] };
      return parsed.data;
    } catch (error) {
      this.logger.warn(
        `encyclopedia research triage failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { decisions: [] };
    }
  }
}
