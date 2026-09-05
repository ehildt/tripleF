import { Injectable, Logger } from '@nestjs/common';

import {
  type MemoryTaxonomyKind,
  type MemoryTaxonomyLane,
} from '../../persistence/constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.js';
import { MemoryTaxonomyRepository } from '../../persistence/services/memory-taxonomy.repository.js';
import type { MemoryTaxonomyReconcileJobData } from '../../qdrant/models/memory.model.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { TaxonomyVectorRepository } from '../../qdrant/services/taxonomy-vector.repository.js';
import { TAXONOMY_LANE_FIELDS } from '../constants/taxonomy-fields.constant.js';
import {
  RECONCILE_MAX_PAIRS,
  TAXONOMY_RECONCILE_AUTO,
  TAXONOMY_RECONCILE_FLOOR,
} from '../constants/taxonomy-reconcile.constant.js';
import { pickMergeWinner } from '../helpers/pick-merge-winner.helper.js';
import { scoreLabelPair } from '../helpers/score-label-pair.helper.js';

import { TaxonomyAdjudicatorService } from './taxonomy-adjudicator.service.js';
import { TaxonomyMergeService } from './taxonomy-merge.service.js';
import { TaxonomyProbeService } from './taxonomy-probe.service.js';

/** The sweep's per-lane tier coverage (the encyclopedia carries no tag bag). */
const LANES_KINDS: Record<'partition' | 'encyclopedia', MemoryTaxonomyKind[]> =
  {
    partition: ['cluster', 'community', 'hub', 'tag'],
    encyclopedia: ['cluster', 'community', 'hub'],
  };

/** Field mapping per lane lives in constants/taxonomy-fields.constant.ts. */

/** One scored candidate pair awaiting a decision. */
interface CandidatePair {
  a: MemoryTaxonomyNodeRecord;
  b: MemoryTaxonomyNodeRecord;
  kind: MemoryTaxonomyKind;
  /** Fused similarity (0..1). */
  score: number;
  /** Which signal dominated (provenance on the alias row). */
  signal: 'fuzzy' | 'semantic';
  tokenOverlap: boolean;
}

/** Per-run outcome tallies for the summary log. */
interface ReconcileCounts {
  candidates: number;
  autoMerged: number;
  llmMerged: number;
  distinct: number;
  deferred: number;
}

/**
 * Taxonomy reconciliation job handler (vectorize queue): the background
 * label-merge sweep that closes what the write-boundary snap deliberately
 * left open (precision over recall). Over one scope's registry, per tier:
 *
 * 1. Candidacy: pairwise trigram × label-embedding cosine (fused as max +
 *    agreement bonus), floored per kind; communities/hubs only pair within
 *    the same parent (type partitioning per research).
 * 2. Auto-merge band: fused ≥ the kind's snap threshold AND the labels share
 *    a token — no LLM call; a token-disjoint pair is never auto-merged even
 *    at high semantic similarity (the no-overlap guard).
 * 3. Ambiguous band [floor, auto): one LLM verdict {same, distinct} per pair
 *    (precision-first instructions; unparseable ⇒ warn + defer, self-heals
 *    on the next run).
 *
 * A merge applies as: payload rewrite of every point carrying the losing
 * label (idempotent, resumable) → alias row with the decision's provenance +
 * score → the losing node folds into the winner (children re-parent, name
 * collisions exact-collapse) → the loser's label vector is dropped. Merge
 * winner: higher point count, tie broken by the older row (the established
 * label wins — churn stays minimal). dryRun logs decisions only.
 */
@Injectable()
export class TaxonomyReconcileJobService {
  private readonly logger = new Logger(TaxonomyReconcileJobService.name);

  constructor(
    private readonly taxonomy: MemoryTaxonomyRepository,
    private readonly taxonomyMerge: TaxonomyMergeService,
    private readonly taxonomyVectors: TaxonomyVectorRepository,
    private readonly taxonomyProbe: TaxonomyProbeService,
    private readonly adjudicator: TaxonomyAdjudicatorService,
    private readonly memoryRepository: MemoryRepository,
    private readonly encyclopediaRepository: EncyclopediaRepository,
  ) {}

  async execute(data: MemoryTaxonomyReconcileJobData): Promise<void> {
    const pairCap = Math.min(data.limit ?? 100, RECONCILE_MAX_PAIRS);
    const nodes = await this.taxonomy.listNodes(data.lane, data.scopeKey);
    const counts: ReconcileCounts = {
      candidates: 0,
      autoMerged: 0,
      llmMerged: 0,
      distinct: 0,
      deferred: 0,
    };
    const mergedIds = new Set<string>();
    let budget = pairCap;

    for (const kind of LANES_KINDS[data.lane]) {
      if (budget <= 0) break;
      const tier = nodes.filter(
        (node) => node.kind === kind && !mergedIds.has(node.id),
      );
      const pairs = await this.candidatePairs(
        data.lane,
        data.scopeKey,
        tier,
        kind,
      );
      counts.candidates += pairs.length;
      for (const pair of pairs.slice(0, budget)) {
        budget--;
        counts[
          (await this.decideAndApply(data, pair, mergedIds)) as
            'autoMerged' | 'llmMerged' | 'distinct' | 'deferred'
        ]++;
      }
    }

    this.logger.log(
      `taxonomy-reconcile ${data.lane}/${data.scopeKey}: ${counts.candidates} candidate pairs — auto-merged ${counts.autoMerged}, llm-merged ${counts.llmMerged}, distinct ${counts.distinct}, deferred ${counts.deferred}${data.dryRun ? ' (dryRun)' : ''}`,
    );
  }

  /**
   * Score every eligible pair of one tier: fused trigram × embedding cosine,
   * parent-partitioned for the tree tiers, floored, strongest first.
   */
  private async candidatePairs(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    tier: MemoryTaxonomyNodeRecord[],
    kind: MemoryTaxonomyKind,
  ): Promise<CandidatePair[]> {
    if (tier.length < 2) return [];
    await this.taxonomyProbe.ensureLabelsEmbedded(tier, lane, scopeKey);
    const vectors = await this.taxonomyVectors.listLabelVectors(
      tier.map((node) => node.id),
    );
    const floor = TAXONOMY_RECONCILE_FLOOR[kind];
    const pairs: CandidatePair[] = [];
    // Tree tiers only merge within one parent (type partitioning).
    const parentPartitioned = kind === 'community' || kind === 'hub';
    for (let i = 0; i < tier.length; i++) {
      for (let j = i + 1; j < tier.length; j++) {
        const a = tier[i];
        const b = tier[j];
        if (parentPartitioned && a.parentId !== b.parentId) continue;
        const scored = scoreLabelPair({
          nameA: a.normalizedName,
          nameB: b.normalizedName,
          vectorA: vectors.get(a.id),
          vectorB: vectors.get(b.id),
          floor,
        });
        if (!scored) continue;
        pairs.push({ a, b, kind, ...scored });
      }
    }
    return pairs.sort((x, y) => y.score - x.score);
  }

  /** Decide one pair and apply the merge; returns the tally bucket. */
  private async decideAndApply(
    data: MemoryTaxonomyReconcileJobData,
    pair: CandidatePair,
    mergedIds: Set<string>,
  ): Promise<'autoMerged' | 'llmMerged' | 'distinct' | 'deferred'> {
    const auto =
      pair.score >= TAXONOMY_RECONCILE_AUTO[pair.kind] && pair.tokenOverlap;
    if (!auto) {
      const verdict = await this.adjudicator.adjudicate(data.model, {
        kind: pair.kind,
        labelA: pair.a.name,
        labelB: pair.b.name,
        countA: await this.countPoints(data, pair.a),
        countB: await this.countPoints(data, pair.b),
      });
      if (!verdict) return 'deferred';
      if (verdict.verdict === 'distinct') return 'distinct';
    }

    const [countA, countB] = [
      await this.countPoints(data, pair.a),
      await this.countPoints(data, pair.b),
    ];
    // The established label wins: more leaves first, then the older row,
    // then lexical — fully deterministic, minimal churn.
    const winner = pickMergeWinner({ a: pair.a, b: pair.b, countA, countB });
    const loser = winner.id === pair.a.id ? pair.b : pair.a;
    const how = auto ? pair.signal : 'llm';

    if (data.dryRun) {
      this.logger.log(
        `taxonomy-reconcile [dryRun]: ${pair.kind} "${loser.name}" → "${winner.name}" (${how}, ${pair.score.toFixed(3)}, leaves ${countA}/${countB})`,
      );
      return auto ? 'autoMerged' : 'llmMerged';
    }

    await this.taxonomyMerge.mergeLabels({
      lane: data.lane,
      scopeKey: data.scopeKey,
      winner,
      loser,
      source: how,
      score: pair.score,
    });
    mergedIds.add(loser.id);
    this.logger.log(
      {
        lane: data.lane,
        scopeKey: data.scopeKey,
        kind: pair.kind,
        merged: loser.name,
        into: winner.name,
        how,
        score: pair.score,
      },
      'taxonomy-reconcile merged labels',
    );
    return auto ? 'autoMerged' : 'llmMerged';
  }

  /** Leaf count of one node (usage signal for winner-picking). */
  private async countPoints(
    data: MemoryTaxonomyReconcileJobData,
    node: MemoryTaxonomyNodeRecord,
  ): Promise<number> {
    const field = TAXONOMY_LANE_FIELDS[data.lane][node.kind];
    if (!field) return 0;
    return data.lane === 'encyclopedia'
      ? this.encyclopediaRepository.countByLabel(
          field as 'category' | 'community' | 'topic',
          node.name,
        )
      : this.memoryRepository.countByLabel(
          data.scopeKey,
          field as 'category' | 'community' | 'subject' | 'tags',
          node.name,
        );
  }

  /** Rewrite every point payload carrying the losing label to the winner's. */
  private async rewritePoints(
    data: MemoryTaxonomyReconcileJobData,
    kind: MemoryTaxonomyKind,
    from: string,
    to: string,
  ): Promise<void> {
    if (data.lane === 'encyclopedia') {
      const field = TAXONOMY_LANE_FIELDS.encyclopedia[kind];
      if (!field) return; // the encyclopedia carries no tag bag
      await this.encyclopediaRepository.collapseLabel(
        field as 'category' | 'community' | 'topic',
        from,
        to,
      );
      return;
    }
    if (kind === 'cluster') {
      await this.memoryRepository.collapseCategory(data.scopeKey, from, to);
    } else if (kind === 'community') {
      await this.memoryRepository.collapseCommunity(data.scopeKey, from, to);
    } else if (kind === 'hub') {
      await this.memoryRepository.collapseSubject(data.scopeKey, from, to);
    } else {
      await this.memoryRepository.retagLabel(data.scopeKey, from, to);
    }
  }
}
