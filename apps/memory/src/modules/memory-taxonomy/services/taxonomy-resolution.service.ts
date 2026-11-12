import { Injectable, Logger } from '@nestjs/common';

import type { MemoryTaxonomyLane } from '../../persistence/constants/memory-taxonomy.constant.js';
import { TAXONOMY_ROOT_PARENT } from '../../persistence/constants/memory-taxonomy.constant.js';
import { MemoryTaxonomyRepository } from '../../persistence/services/memory-taxonomy.repository.js';
import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.types.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { TaxonomyVectorRepository } from '../../qdrant/services/taxonomy-vector.repository.js';
import { bestFuzzyMatch } from '../helpers/best-fuzzy-match.helper.js';
import { buildResolutionOutcome } from '../helpers/build-resolution-outcome.helper.js';
import { normalizeTaxonomyIcon } from '../helpers/normalize-taxonomy-icon.helper.js';

import type {
  TaxonomyLabelInput,
  TaxonomyResolvedLabel,
} from './taxonomy-resolution.service.types.js';

/**
 * Deterministic taxonomy snap at every memory write boundary: the model may
 * name labels freely, the registry stores them canonically. Resolution order
 * per label: exact normalized-name hit → permanent alias hit → trigram fuzzy
 * snap above the per-kind threshold (skipped for token-disjoint candidates —
 * a no-overlap name is a distinct topic, never a variant) → mint a new tier
 * entry (concurrency-safe get-or-create + label vector for semantic probing).
 * Every fuzzy snap writes an alias row so the killed wording resolves forever.
 *
 * Parent-aware within one batch: entries are processed in tier order
 * (cluster → community → hub → node → tag); a `parentRef` narrows exact/fuzzy
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
   * one outcome per input label, in input order. `exactOnly` is reserved for
   * stored-chain reconciliation: it skips alias/fuzzy adoption before minting.
   */
  async resolveLabels(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    labels: TaxonomyLabelInput[],
    options: { exactOnly?: boolean } = {},
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
        options.exactOnly === true,
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
    exactOnly = false,
  ): Promise<TaxonomyResolvedLabel> {
    const parentId = parent?.id ?? TAXONOMY_ROOT_PARENT;
    if (entry.parentRef && !parent) {
      throw new Error(
        `Unresolved ${entry.kind} parent reference: ${entry.parentRef}`,
      );
    }
    const candidates = nodes.filter(
      (node) =>
        node.kind === entry.kind &&
        (parent !== undefined
          ? node.parentId === parent.id
          : entry.parentRef === undefined),
    );

    // 1. Exact: only the current parent partition is eligible. A same-named
    // label under another parent is a different hierarchy entry.
    const exact = candidates.find(
      (node) => node.normalizedName === entry.label,
    );
    if (exact) {
      return buildResolutionOutcome(entry, exact, 'exact');
    }

    // 2. Alias: a previously snapped/renamed/merged variant.
    const aliasNodeId = exactOnly
      ? undefined
      : await this.taxonomy.resolveAlias(
          lane,
          scopeKey,
          entry.kind,
          entry.label,
        );
    const aliasNode = aliasNodeId
      ? nodes.find(
          (node) => node.id === aliasNodeId && node.parentId === parentId,
        )
      : undefined;
    if (aliasNode) {
      return buildResolutionOutcome(entry, aliasNode, 'alias');
    }

    // 3. Fuzzy: trigram snap remains inside the same parent partition.
    const fuzzy = exactOnly
      ? undefined
      : bestFuzzyMatch(entry.label, candidates, entry.kind);
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
      return buildResolutionOutcome(entry, fuzzy.node, 'fuzzy', fuzzy.score);
    }

    // 4. Mint: a genuinely new label registers (get-or-create; racing
    // workers re-resolve on the unique key).
    const minted = await this.mint(lane, scopeKey, entry, parentId);
    if (!nodes.some((node) => node.id === minted.id)) nodes.push(minted);
    return buildResolutionOutcome(entry, minted, 'minted');
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
