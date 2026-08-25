import { Inject, Injectable, Logger } from '@nestjs/common';
import { buildEnrichPrompt } from '@triplef/agent/prompts';
import {
  type ConsolidationVerdict,
  MemoryEnrichmentSchema,
} from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../../../ai-sdk/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../../../ai-sdk/helpers/provider-options.helper.js';
import type { MemoryLinkRow } from '../../../../persistence/services/memory-link.repository.js';
import { MemoryLinkRepository } from '../../../../persistence/services/memory-link.repository.js';
import { QDRANT_CONFIG } from '../../../constants/qdrant.constants.js';
import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import { normalizeCategory } from '../../../helpers/normalize-category.helper.js';
import { normalizeTags } from '../../../helpers/normalize-tags.helper.js';
import type {
  MemoryPoint,
  MemoryRelinkJobData,
  MemoryRole,
} from '../../../models/memory.model.js';
import type { QdrantConfig } from '../../../models/qdrant-config.model.js';
import { ConsolidationAdjudicatorService } from '../../consolidation-adjudicator.service.js';
import { EmbeddingService } from '../../embedding.service.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemorySearchService } from '../../memory-search.service.js';

/** Hard cap on points processed per category per pass (the DTO caps at 500 too). */
const MAX_POINTS_PER_CATEGORY = 500;
/** Hard cap on full passes over the categories (the DTO caps at 10 too). */
const MAX_PASSES = 10;
/** Near-duplicate candidate pool per point (mirrors the consolidate sweep). */
const DEDUPE_CANDIDATES = 5;
/** Inter-category net is wider than intra so related hubs can be found. */
const INTER_NEIGHBOR_MULTIPLIER = 2;

/** One category point as scrolled by the relink job (payload + vector). */
interface CategoryPoint {
  id: string;
  vector: number[];
  text: string;
  role: MemoryRole;
  tags: string[];
  createdAt: string;
  requestId?: string;
}

/** Per-run outcome tallies for the summary log. */
interface RelinkCounts {
  collapsed: number;
  deduped: number;
  topicalEdges: number;
  enriched: number;
  passes: number;
}

/**
 * Relink sweep job handler (vectorize queue): the category-aware
 * consolidation + soft-link pass over ONE partition's existing points.
 *
 * Step A — inventory & collapse: facet the `category` payload, group values
 * by their canonical form (normalizeCategory), rewrite variants via
 * setPayload-by-filter (payload-only, no vector rewrites).
 *
 * Step B — per-category dedupe: for each category in fixed order (count desc,
 * then name), screen each point's near-duplicates within the category and
 * adjudicate with the shared LLM verdicts {keep, redundant, merge}. Full
 * passes repeat until one applies zero mutations or `maxPasses` is hit —
 * merges write deterministic ids, so the same pair cannot re-merge.
 *
 * Step C — topical links: purge the scope's existing topical edges, then
 * write suggested (never enforced) edges: intra-category pairs in the
 * [topical, semantic) score band, plus inter-category pairs that share a tag
 * or clear the semantic bar. One edge per pair — the unique constraint keeps
 * a single row and semantic wins.
 *
 * Step D — gated enrichment: when `enrich` is set, refine each point's tags
 * via one LLM call and write them back (off by default — tags are the recall
 * filter vocabulary).
 *
 * Failure philosophy (matches the consolidate job): Qdrant/Postgres/embed
 * errors propagate to BullMQ (retry); a garbage/unparseable verdict for a
 * point is warn + skip (self-heals on the next run, never burns retries on a
 * deterministic failure).
 */
@Injectable()
export class MemoryRelinkJobService {
  private readonly logger = new Logger(MemoryRelinkJobService.name);

  constructor(
    private readonly adjudicator: ConsolidationAdjudicatorService,
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly memorySearch: MemorySearchService,
    private readonly memoryRepository: MemoryRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly links: MemoryLinkRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  async execute(data: MemoryRelinkJobData): Promise<void> {
    const limit = Math.min(data.limit ?? 100, MAX_POINTS_PER_CATEGORY);
    const maxPasses = Math.min(data.maxPasses ?? 3, MAX_PASSES);

    const counts: RelinkCounts = {
      collapsed: 0,
      deduped: 0,
      topicalEdges: 0,
      enriched: 0,
      passes: 0,
    };

    counts.collapsed = await this.collapseCategories(data);
    counts.deduped = await this.dedupeCategories(
      data,
      limit,
      maxPasses,
      counts,
    );
    counts.topicalEdges = await this.linkTopical(data, limit);
    if (data.enrich) {
      counts.enriched = await this.enrich(data, limit);
    }

    this.logger.log(
      `memory-relink ${data.memoryPartition}: collapsed ${counts.collapsed}, deduped ${counts.deduped} (${counts.passes} passes), topical edges ${counts.topicalEdges}, enriched ${counts.enriched}${data.dryRun ? ' (dryRun)' : ''}`,
    );
  }

  /** Step A — facet the category payload and collapse identical variants. */
  private async collapseCategories(data: MemoryRelinkJobData): Promise<number> {
    const facets = await this.memoryRepository.facetCategories(
      data.memoryPartition,
    );
    const groups = new Map<string, string[]>();
    for (const facet of facets) {
      const canonical = normalizeCategory(facet.value);
      if (!canonical) continue;
      const variants = groups.get(canonical) ?? [];
      variants.push(facet.value);
      groups.set(canonical, variants);
    }

    let collapsed = 0;
    for (const [canonical, variants] of groups) {
      for (const variant of variants) {
        if (variant === canonical) continue;
        if (data.dryRun) {
          this.logger.log(
            `memory-relink ${data.memoryPartition} [dryRun]: collapse "${variant}" → "${canonical}"`,
          );
          continue;
        }
        await this.memoryRepository.collapseCategory(
          data.memoryPartition,
          variant,
          canonical,
        );
        collapsed++;
      }
    }
    return collapsed;
  }

  /**
   * Step B — per-category dedupe with converging passes. Fixed order (count
   * desc, then name) keeps runs deterministic; a pass that applies zero
   * mutations terminates the loop.
   */
  private async dedupeCategories(
    data: MemoryRelinkJobData,
    limit: number,
    maxPasses: number,
    counts: RelinkCounts,
  ): Promise<number> {
    let applied = 0;
    for (let pass = 1; pass <= maxPasses; pass++) {
      counts.passes = pass;
      const categories = await this.orderedCategories(data.memoryPartition);
      if (categories.length === 0) break;
      let passApplied = 0;
      for (const category of categories) {
        passApplied += await this.dedupeCategory(data, category, limit);
      }
      applied += passApplied;
      if (passApplied === 0) break;
    }
    return applied;
  }

  /** One category's dedupe pass: screen each point, adjudicate, apply. */
  private async dedupeCategory(
    data: MemoryRelinkJobData,
    category: string,
    limit: number,
  ): Promise<number> {
    const points = await this.memoryRepository.scrollCategoryPoints(
      data.memoryPartition,
      category,
      limit,
    );
    let applied = 0;
    for (const point of points) {
      const candidates = (
        await this.memorySearch.searchByText({
          memoryPartition: data.memoryPartition,
          category,
          text: point.text,
          limit: DEDUPE_CANDIDATES,
        })
      ).filter((candidate) => candidate.id !== point.id);
      if (candidates.length === 0) continue;

      const verdict = await this.adjudicator.adjudicate(
        data.model,
        {
          text: point.text,
          role: point.role,
          createdAt: point.createdAt,
        },
        candidates.map((candidate) => ({
          text: candidate.text,
          role: candidate.role,
          createdAt: candidate.createdAt,
        })),
      );
      if (!verdict) {
        this.logger.warn(
          `memory-relink ${data.memoryPartition}: verdict unparseable for "${point.text.slice(0, 80)}" — point left as-is`,
        );
        continue;
      }

      if (data.dryRun) {
        this.logger.log(
          `memory-relink ${data.memoryPartition} [dryRun]: ${verdict.verdict} for "${point.text.slice(0, 80)}"`,
        );
        continue;
      }
      applied += await this.applyVerdict(
        data,
        category,
        point,
        candidates,
        verdict,
      );
    }
    return applied;
  }

  /** Apply one verdict; returns 1 when a mutation was applied, else 0. */
  private async applyVerdict(
    data: MemoryRelinkJobData,
    category: string,
    point: CategoryPoint,
    candidates: MemoryPoint[],
    verdict: ConsolidationVerdict,
  ): Promise<number> {
    if (verdict.verdict === 'keep') return 0;
    if (verdict.verdict === 'redundant') {
      await this.memoryRepository.deleteByIds([point.id]);
      return 1;
    }

    const mergedText = verdict.mergedText?.trim();
    if (!mergedText) {
      this.logger.warn(
        `memory-relink ${data.memoryPartition}: merge verdict without mergedText — point left as-is`,
      );
      return 0;
    }
    const role =
      point.role === 'user' || candidates.some((c) => c.role === 'user')
        ? 'user'
        : 'assistant';
    const [vector] = await this.embeddingService.embed(
      [mergedText],
      'document',
    );
    if (!vector) {
      this.logger.warn(
        `memory-relink ${data.memoryPartition}: embed returned no vector — point left as-is`,
      );
      return 0;
    }
    const id = deterministicPointId(
      `${data.memoryPartition}|${role}|${mergedText}`,
    );
    const tags = [
      ...new Set([...point.tags, ...candidates.flatMap((c) => c.tags)]),
    ];
    await this.memoryRepository.upsertBatch({
      memoryPartition: data.memoryPartition,
      role,
      requestId: point.requestId,
      points: [{ id, vector, text: mergedText, tags, category }],
    });
    await this.memoryRepository.deleteByIds([
      point.id,
      ...candidates.map((c) => c.id),
    ]);
    this.logger.log(
      {
        memoryPartition: data.memoryPartition,
        category,
        pointId: id,
        mergedText,
        removedPointIds: [point.id, ...candidates.map((c) => c.id)],
      },
      'memory-relink merged records',
    );
    return 1;
  }

  /**
   * Step C — topical (suggested) edges. Purge the scope's existing topical
   * edges, then write intra-category pairs in the [topical, semantic) band
   * and inter-category pairs that share a tag or clear the semantic bar.
   */
  private async linkTopical(
    data: MemoryRelinkJobData,
    limit: number,
  ): Promise<number> {
    const categories = await this.orderedCategories(data.memoryPartition);
    const edges: MemoryLinkRow[] = [];
    const seen = new Set<string>();
    for (const category of categories) {
      const points = await this.memoryRepository.scrollCategoryPoints(
        data.memoryPartition,
        category,
        limit,
      );
      for (const point of points) {
        await this.collectIntraEdges(data, category, point, edges, seen);
        await this.collectInterEdges(data, category, point, edges, seen);
      }
    }

    if (data.dryRun) {
      this.logger.log(
        `memory-relink ${data.memoryPartition} [dryRun]: ${edges.length} topical edges would be written`,
      );
      return 0;
    }
    await this.links.deleteByKind(
      'partition',
      this.collection,
      data.memoryPartition,
      'topical',
    );
    await this.links.upsertEdges(edges);
    return edges.length;
  }

  /** Intra-category edges: same family, weaker band — the semantic threshold already owns the strong pairs. */
  private async collectIntraEdges(
    data: MemoryRelinkJobData,
    category: string,
    point: CategoryPoint,
    edges: MemoryLinkRow[],
    seen: Set<string>,
  ): Promise<void> {
    const intra = await this.memoryRepository.queryNeighbors(
      data.memoryPartition,
      category,
      point.vector,
      this.config.linkNeighbors,
      this.config.linkTopicalThreshold,
    );
    for (const hit of intra) {
      if (hit.id === point.id) continue;
      if (hit.score >= this.config.linkScoreThreshold) continue;
      this.pushEdge(edges, seen, data, point.id, hit.id, hit.score);
    }
  }

  /** Inter-category edges: related families — shared tag vocabulary or a strong enough score to be a genuine cross-family suggestion. */
  private async collectInterEdges(
    data: MemoryRelinkJobData,
    category: string,
    point: CategoryPoint,
    edges: MemoryLinkRow[],
    seen: Set<string>,
  ): Promise<void> {
    const inter = await this.memoryRepository.queryNeighbors(
      data.memoryPartition,
      undefined,
      point.vector,
      this.config.linkNeighbors * INTER_NEIGHBOR_MULTIPLIER,
      this.config.linkTopicalThreshold,
    );
    for (const hit of inter) {
      if (hit.id === point.id) continue;
      if (hit.category === category) continue;
      const sharesTag = point.tags.some((tag) => hit.tags.includes(tag));
      if (!sharesTag && hit.score < this.config.linkScoreThreshold) continue;
      this.pushEdge(edges, seen, data, point.id, hit.id, hit.score);
    }
  }

  /** Step D — gated tag enrichment: one LLM call per point, written back. */
  private async enrich(
    data: MemoryRelinkJobData,
    limit: number,
  ): Promise<number> {
    const categories = await this.orderedCategories(data.memoryPartition);
    let enriched = 0;
    for (const category of categories) {
      const points = await this.memoryRepository.scrollCategoryPoints(
        data.memoryPartition,
        category,
        limit,
      );
      for (const point of points) {
        const tags = await this.refineTags(data.model, point);
        if (!tags) continue;
        if (data.dryRun) {
          this.logger.log(
            `memory-relink ${data.memoryPartition} [dryRun]: tags for "${point.text.slice(0, 80)}" → ${tags.join(', ')}`,
          );
          continue;
        }
        await this.memoryRepository.setPayloadForPoints([point.id], { tags });
        enriched++;
      }
    }
    return enriched;
  }

  /** One LLM tag-refinement call; undefined when the answer is unusable. */
  private async refineTags(
    model: string,
    point: CategoryPoint,
  ): Promise<string[] | undefined> {
    const { text } = await this.aiSdkService.generateChat({
      model,
      messages: [
        { role: 'system', content: buildEnrichPrompt() },
        {
          role: 'user',
          content: `Record: ${point.text}\nCurrent tags: ${point.tags.join(', ')}`,
        },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
      }),
      tools: {},
    });
    if (!text?.trim()) return undefined;
    try {
      const parsed = MemoryEnrichmentSchema.safeParse(parseLlmJson(text));
      if (!parsed.success) return undefined;
      return normalizeTags(parsed.data.tags);
    } catch {
      return undefined;
    }
  }

  /** Canonical categories of the partition, fixed order: count desc, then name. */
  private async orderedCategories(memoryPartition: string): Promise<string[]> {
    const facets = await this.memoryRepository.facetCategories(memoryPartition);
    return facets
      .map((facet) => ({
        value: normalizeCategory(facet.value),
        count: facet.count,
      }))
      .filter((facet): facet is { value: string; count: number } =>
        Boolean(facet.value),
      )
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .map((facet) => facet.value);
  }

  /** Canonical undirected edge push with pair dedupe. */
  private pushEdge(
    edges: MemoryLinkRow[],
    seen: Set<string>,
    data: MemoryRelinkJobData,
    a: string,
    b: string,
    score: number,
  ): void {
    const [source, target] = [a, b].sort();
    const pairKey = `${source}|${target}`;
    if (seen.has(pairKey)) return;
    seen.add(pairKey);
    edges.push({
      lane: 'partition',
      collection: this.collection,
      scopeKey: data.memoryPartition,
      source,
      target,
      score,
      kind: 'topical',
    });
  }

  private get collection(): string {
    return this.memoryRepository.collection;
  }
}
