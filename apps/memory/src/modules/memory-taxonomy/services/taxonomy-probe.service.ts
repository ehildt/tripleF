import { Injectable, Logger } from '@nestjs/common';
import type { TaxonomyVocabulary } from '@triplef/agent/prompts';
import type {
  MemoryTaxonomyProbeCandidate,
  MemoryTaxonomyProbeInput,
  MemoryTaxonomyProbeResult,
} from '@triplef/agent/tools';

import { normalizeCategory } from '../../memory-partition/helpers/normalize-category.helper.js';
import type { MemoryTaxonomyLane } from '../../persistence/constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';
import { MemoryTaxonomyRepository } from '../../persistence/services/memory-taxonomy.repository.js';
import { normalizeCommunity } from '../../qdrant/helpers/normalize-community.helper.js';
import { normalizeSubject } from '../../qdrant/helpers/normalize-subject.helper.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { TaxonomyVectorRepository } from '../../qdrant/services/taxonomy-vector.repository.js';
import {
  PROBE_CANDIDATE_LIMIT,
  PROBE_SCORE_FLOOR,
  SEMANTIC_CANDIDATE_POOL,
  VOCABULARY_RANK_LIMITS,
} from '../constants/taxonomy-vocabulary.constant.js';
import { trigramSimilarity } from '../helpers/trigram-similarity.helper.js';

/** Normalize a probe query with its tier's boundary normalizer. */
function normalizeProbeQuery(
  kind: MemoryTaxonomyProbeInput['kind'],
  query: string,
): string {
  const normalized =
    kind === 'cluster'
      ? normalizeCategory(query)
      : kind === 'community'
        ? normalizeCommunity(query)
        : normalizeSubject(query);
  return normalized ?? query.trim().toLowerCase();
}

const KIND_NOUN: Record<MemoryTaxonomyProbeInput['kind'], string> = {
  cluster: 'plural family noun',
  community: 'plural sub-family noun',
  hub: 'singular subject entity',
};

/**
 * The taxonomy probe backing the `memory-taxonomy-probe` tool and the
 * ranked vocabulary sections of the extraction/write/classify prompts.
 *
 * Hybrid candidate retrieval (research §1): exact normalized-name and alias
 * hits pin the top; trigram name similarity and label-embedding cosine are
 * fused with max + agreement bonus; results are always scoped to one
 * (lane, scopeKey, kind[, parentId]) — type partitioning that keeps the
 * candidate space small and comparable.
 *
 * Label vectors are lazily (re-)minted: labels missing vectors (fresh mints
 * after an embed-model switch) are embedded in one batch before the semantic
 * leg runs, so probing never silently degrades to name-matching only.
 */
@Injectable()
export class TaxonomyProbeService {
  private readonly logger = new Logger(TaxonomyProbeService.name);

  constructor(
    private readonly taxonomy: MemoryTaxonomyRepository,
    private readonly taxonomyVectors: TaxonomyVectorRepository,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /** One probe: hybrid candidates for one label against one taxonomy tier. */
  async probe(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    input: MemoryTaxonomyProbeInput,
  ): Promise<MemoryTaxonomyProbeResult> {
    const query = normalizeProbeQuery(input.kind, input.query);
    const nodes = (await this.taxonomy.listNodes(lane, scopeKey)).filter(
      (node) =>
        node.kind === input.kind &&
        (input.parentId === undefined || node.parentId === input.parentId),
    );
    await this.ensureLabelsEmbedded(nodes, lane, scopeKey);

    // Exact + alias hits pin the top — identity, never a ranking question.
    const pinned: MemoryTaxonomyProbeCandidate[] = [];
    const exact = nodes.find((node) => node.normalizedName === query);
    let pinnedNode = exact;
    if (!pinnedNode) {
      const aliasNodeId = await this.taxonomy.resolveAlias(
        lane,
        scopeKey,
        input.kind,
        query,
      );
      pinnedNode = aliasNodeId
        ? nodes.find((node) => node.id === aliasNodeId)
        : undefined;
    }
    if (pinnedNode) {
      pinned.push({
        id: pinnedNode.id,
        name: pinnedNode.name,
        score: 1,
        summary: pinnedNode.summary,
        icon: pinnedNode.icon,
      });
    }

    const semantic = await this.semanticLeg(lane, scopeKey, input, query);
    const scored = nodes
      .filter((node) => node.id !== pinnedNode?.id)
      .map((node) => {
        const fuzzy = trigramSimilarity(query, node.normalizedName);
        const semanticScore = semantic.get(node.id) ?? 0;
        // Agreement bonus: both signals moderately agree → the candidate is
        // very likely the same concept (research §1 fusion).
        const agreement = fuzzy >= 0.6 && semanticScore >= 0.6 ? 0.05 : 0;
        return {
          node,
          score: Math.min(1, Math.max(fuzzy, semanticScore) + agreement),
        };
      })
      .filter((entry) => entry.score >= PROBE_SCORE_FLOOR)
      .sort(
        (a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name),
      )
      .slice(0, Math.max(0, PROBE_CANDIDATE_LIMIT - pinned.length))
      .map((entry): MemoryTaxonomyProbeCandidate => {
        return {
          id: entry.node.id,
          name: entry.node.name,
          score: Math.round(entry.score * 1000) / 1000,
          summary: entry.node.summary,
          icon: entry.node.icon,
        };
      });

    const candidates = [...pinned, ...scored];
    return {
      kind: input.kind,
      query,
      candidates,
      guidance:
        candidates.length > 0
          ? 'ADOPT one candidate verbatim when it fits (keep its id as parentId for the next tier), or CREATE a new label only when every candidate misses the meaning.'
          : `No existing ${input.kind} fits — CREATE your label (a ${KIND_NOUN[input.kind]}), then continue probing the tier below with the created lineage.`,
    };
  }

  /**
   * The ranked per-tier vocabulary for one source text — the labels most
   * similar to the text by label-embedding cosine. Powers the reuse-first
   * vocabulary section of the extraction/write/classify prompts.
   */
  async rankVocabulary(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    text: string,
  ): Promise<TaxonomyVocabulary> {
    const nodes = await this.taxonomy.listNodes(lane, scopeKey);
    if (nodes.length === 0 || !text.trim()) return {};
    await this.ensureLabelsEmbedded(nodes, lane, scopeKey);

    const [vector] = await this.embeddingService.embed([text], 'query');
    if (!vector) return {};

    const namesById = new Map(nodes.map((node) => [node.id, node.name]));
    const rank = async (
      kind: MemoryTaxonomyKind,
      limit: number,
    ): Promise<string[]> => {
      const hits = await this.taxonomyVectors.searchLabels({
        lane,
        scopeKey,
        kind,
        vector,
        limit,
      });
      return hits.map((hit) => namesById.get(hit.id) ?? '').filter(Boolean);
    };

    const [categories, communities, hubs, tags] = await Promise.all([
      rank('cluster', VOCABULARY_RANK_LIMITS.cluster),
      rank('community', VOCABULARY_RANK_LIMITS.community),
      rank('hub', VOCABULARY_RANK_LIMITS.hub),
      rank('tag', VOCABULARY_RANK_LIMITS.tag),
    ]);
    return { categories, communities, hubs, tags };
  }

  /** Semantic leg of a probe; empty map when the embedder is down. */
  private async semanticLeg(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    input: MemoryTaxonomyProbeInput,
    query: string,
  ): Promise<Map<string, number>> {
    try {
      const [vector] = await this.embeddingService.embed([query], 'query');
      if (!vector) return new Map();
      const hits = await this.taxonomyVectors.searchLabels({
        lane,
        scopeKey,
        kind: input.kind,
        parentId: input.parentId,
        vector,
        limit: SEMANTIC_CANDIDATE_POOL,
      });
      return new Map(hits.map((hit) => [hit.id, hit.score]));
    } catch (error) {
      this.logger.warn(
        { lane, scopeKey, kind: input.kind, query },
        `taxonomy probe semantic leg skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return new Map();
    }
  }

  /**
   * Lazy re-embed: labels without a vector in the current taxonomy collection
   * get embedded in one batch (covers fresh mints after an embed-model
   * switch). Warn-and-continue — callers degrade to name matching only.
   * Public: the reconciliation sweep needs full pairwise coverage.
   */
  async ensureLabelsEmbedded(
    nodes: Array<{
      id: string;
      lane: MemoryTaxonomyLane;
      scopeKey: string;
      kind: MemoryTaxonomyKind;
      parentId: string;
      normalizedName: string;
    }>,
    lane: MemoryTaxonomyLane,
    scopeKey: string,
  ): Promise<void> {
    if (nodes.length === 0) return;
    try {
      const existing = await this.taxonomyVectors.listExistingIds(
        nodes.map((node) => node.id),
      );
      const missing = nodes.filter((node) => !existing.has(node.id));
      if (missing.length === 0) return;
      const vectors = await this.embeddingService.embed(
        missing.map((node) => node.normalizedName),
        'document',
      );
      const points = missing.flatMap((node, index) =>
        vectors[index]
          ? [
              {
                id: node.id,
                vector: vectors[index],
                lane,
                scopeKey,
                kind: node.kind,
                parentId: node.parentId,
                normalizedName: node.normalizedName,
              },
            ]
          : [],
      );
      await this.taxonomyVectors.upsertLabelPoints(points);
    } catch (error) {
      this.logger.warn(
        { lane, scopeKey },
        `taxonomy label re-embed skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
