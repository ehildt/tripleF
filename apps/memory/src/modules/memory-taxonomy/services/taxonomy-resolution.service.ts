import { Injectable, Logger } from '@nestjs/common';

import type {
  MemoryTaxonomyKind,
  MemoryTaxonomyLane,
} from '../../persistence/constants/memory-taxonomy.constant.js';
import { TAXONOMY_ROOT_PARENT } from '../../persistence/constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.js';
import { MemoryTaxonomyRepository } from '../../persistence/services/memory-taxonomy.repository.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { TaxonomyVectorRepository } from '../../qdrant/services/taxonomy-vector.repository.js';
import { TAXONOMY_SNAP_THRESHOLDS } from '../constants/taxonomy-snap.constant.js';
import { normalizeTaxonomyIcon } from '../helpers/normalize-taxonomy-icon.helper.js';
import {
  sharesTokenOverlap,
  trigramSimilarity,
} from '../helpers/trigram-similarity.helper.js';

/** One label to resolve (pre-normalized by the kind's boundary normalizer). */
export interface TaxonomyLabelInput {
  kind: MemoryTaxonomyKind;
  /** Canonical-form label (already normalized at the write boundary). */
  label: string;
  /**
   * Input `label` of the parent entry resolved earlier in the same batch
   * (community → its category; hub → its community or category). Tags are
   * flat and pass no parent.
   */
  parentRef?: string;
}

/** Resolution outcome for one label. */
export interface TaxonomyResolvedLabel {
  kind: MemoryTaxonomyKind;
  /** The label as passed in. */
  input: string;
  /** Canonical name to store on points. */
  name: string;
  nodeId: string;
  how: 'exact' | 'alias' | 'fuzzy' | 'minted';
  /** Fuzzy similarity that justified a snap. */
  score?: number;
}

/**
 * Deterministic taxonomy snap at every memory write boundary: the model may
 * name labels freely, the registry stores them canonically. Resolution order
 * per label: exact normalized-name hit → permanent alias hit → trigram fuzzy
 * snap above the per-kind threshold (skipped for token-disjoint candidates —
 * a no-overlap name is a distinct topic, never a variant) → mint a new node
 * (concurrency-safe get-or-create + label vector for semantic probing).
 * Every fuzzy snap writes an alias row so the killed wording resolves forever.
 *
 * Parent-aware within one batch: entries are processed in tier order
 * (cluster → community → hub → tag); a `parentRef` narrows exact/fuzzy
 * candidacy to that parent's children, keeping the tree coherent.
 */
@Injectable()
export class TaxonomyResolutionService {
  private readonly logger = new Logger(TaxonomyResolutionService.name);

  constructor(
    private readonly taxonomy: MemoryTaxonomyRepository,
    private readonly taxonomyVectors: TaxonomyVectorRepository,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Apply a model-suggested icon hint to the deepest NEWLY minted node of a
   * resolution batch (hub → community → cluster order). Adopted/snapped
   * nodes keep their icons — a hint never overwrites an existing one;
   * non-allowlisted names are dropped silently.
   */
  async applyIconHint(
    icon: string | undefined,
    resolved: readonly TaxonomyResolvedLabel[],
  ): Promise<void> {
    const valid = normalizeTaxonomyIcon(icon);
    if (!valid) return;
    const minted = [...resolved]
      .reverse()
      .find((entry) => entry.how === 'minted' && entry.kind !== 'tag');
    if (!minted) return;
    await this.taxonomy.setIcon(minted.nodeId, valid);
  }

  /**
   * Snap-or-mint one batch of labels against one scope's registry. Returns
   * one outcome per input label, in input order.
   */
  async resolveLabels(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    labels: TaxonomyLabelInput[],
  ): Promise<TaxonomyResolvedLabel[]> {
    const nodes = await this.taxonomy.listNodes(lane, scopeKey);
    const byInputLabel = new Map<string, MemoryTaxonomyNodeRecord>();
    const results: TaxonomyResolvedLabel[] = [];
    for (const entry of labels) {
      const parent = entry.parentRef
        ? byInputLabel.get(entry.parentRef)
        : undefined;
      const result = await this.resolveOne(
        lane,
        scopeKey,
        nodes,
        entry,
        parent,
      );
      results.push(result);
      byInputLabel.set(
        entry.label,
        nodes.find((node) => node.id === result.nodeId)!,
      );
    }
    return results;
  }

  /** Snap-or-mint a single label against the preloaded scope registry. */
  private async resolveOne(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    nodes: MemoryTaxonomyNodeRecord[],
    entry: TaxonomyLabelInput,
    parent: MemoryTaxonomyNodeRecord | undefined,
  ): Promise<TaxonomyResolvedLabel> {
    const parentId = parent?.id ?? TAXONOMY_ROOT_PARENT;
    const candidates = nodes.filter(
      (node) =>
        node.kind === entry.kind &&
        (parent !== undefined
          ? node.parentId === parent.id
          : entry.parentRef === undefined),
    );

    // 1. Exact: the canonical form is already a registry node.
    const exact =
      candidates.find((node) => node.normalizedName === entry.label) ??
      nodes.find(
        (node) =>
          node.kind === entry.kind && node.normalizedName === entry.label,
      );
    if (exact) {
      return outcome(entry, exact, 'exact');
    }

    // 2. Alias: a previously snapped/renamed/merged variant.
    const aliasNodeId = await this.taxonomy.resolveAlias(
      lane,
      scopeKey,
      entry.kind,
      entry.label,
    );
    const aliasNode = aliasNodeId
      ? nodes.find((node) => node.id === aliasNodeId)
      : undefined;
    if (aliasNode) {
      return outcome(entry, aliasNode, 'alias');
    }

    // 3. Fuzzy: trigram snap over the candidacy (token-overlap guard).
    const pool =
      candidates.length > 0
        ? candidates
        : nodes.filter((node) => node.kind === entry.kind);
    const fuzzy = bestFuzzyMatch(entry.label, pool, entry.kind);
    if (fuzzy) {
      await this.taxonomy.insertAlias({
        nodeId: fuzzy.node.id,
        lane,
        scopeKey,
        kind: entry.kind,
        alias: entry.label,
        source: 'fuzzy',
        score: fuzzy.score,
      });
      return outcome(entry, fuzzy.node, 'fuzzy', fuzzy.score);
    }

    // 4. Mint: a genuinely new label registers (get-or-create; racing
    // workers re-resolve on the unique key).
    const minted = await this.mint(lane, scopeKey, entry, parentId);
    if (!nodes.some((node) => node.id === minted.id)) nodes.push(minted);
    return outcome(entry, minted, 'minted');
  }

  /** Register a new node + its label embedding (warn-and-continue on embed failure). */
  private async mint(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    entry: TaxonomyLabelInput,
    parentId: string,
  ): Promise<MemoryTaxonomyNodeRecord> {
    const node = await this.taxonomy.getOrCreateNode({
      lane,
      scopeKey,
      kind: entry.kind,
      parentId,
      name: entry.label,
      normalizedName: entry.label,
      createdBy: 'model',
    });
    try {
      const [vector] = await this.embeddingService.embed(
        [entry.label],
        'document',
      );
      if (vector) {
        await this.taxonomyVectors.upsertLabelPoints([
          {
            id: node.id,
            vector,
            lane,
            scopeKey,
            kind: entry.kind,
            parentId: node.parentId,
            normalizedName: node.normalizedName,
          },
        ]);
      }
    } catch (error) {
      this.logger.warn(
        { lane, scopeKey, kind: entry.kind, label: entry.label },
        `taxonomy label vector skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return node;
  }
}

/** The highest-scoring candidacy snap above the kind's threshold, if any. */
function bestFuzzyMatch(
  label: string,
  pool: MemoryTaxonomyNodeRecord[],
  kind: MemoryTaxonomyKind,
): { node: MemoryTaxonomyNodeRecord; score: number } | undefined {
  let best: { node: MemoryTaxonomyNodeRecord; score: number } | undefined;
  for (const node of pool) {
    if (node.normalizedName === label) continue;
    if (!sharesTokenOverlap(label, node.normalizedName)) continue;
    const score = trigramSimilarity(label, node.normalizedName);
    if (
      score >= TAXONOMY_SNAP_THRESHOLDS[kind] &&
      (!best || score > best.score)
    ) {
      best = { node, score };
    }
  }
  return best;
}

function outcome(
  entry: TaxonomyLabelInput,
  node: MemoryTaxonomyNodeRecord,
  how: TaxonomyResolvedLabel['how'],
  score?: number,
): TaxonomyResolvedLabel {
  return {
    kind: entry.kind,
    input: entry.label,
    name: node.name,
    nodeId: node.id,
    how,
    score,
  };
}
