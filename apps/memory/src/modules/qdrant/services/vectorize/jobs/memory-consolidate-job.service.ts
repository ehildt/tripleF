import { Injectable, Logger } from '@nestjs/common';
import type { ConsolidationVerdict } from '@triplef/agent/schemas';

import type { PendingLedgerEntry } from '../../../../persistence/services/memory-insert-ledger.repository.js';
import { MemoryInsertLedgerRepository } from '../../../../persistence/services/memory-insert-ledger.repository.js';
import { MemoryTaxonomyRepository } from '../../../../persistence/services/memory-taxonomy.repository.js';
import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import {
  taxonomyLabelEntries,
  type TaxonomyLabelEntry,
} from '../../../helpers/taxonomy-label-entries.helper.js';
import type {
  MemoryConsolidateJobData,
  MemoryPoint,
} from '../../../models/memory.model.js';
import { ConsolidationAdjudicatorService } from '../../consolidation-adjudicator.service.js';
import { EmbeddingService } from '../../embedding.service.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import { MemoryOverridesService } from '../../memory-overrides.service.js';
import { MemorySearchService } from '../../memory-search.service.js';

import { mapCandidateToAdjudication } from './helpers/map-candidate-to-adjudication.helper.js';
/** Hard cap on pending inserts adjudicated per run (the DTO caps at 500 too). */
const MAX_PENDING_PER_RUN = 500;

/** Per-run outcome tallies for the summary log. */
interface SweepCounts {
  kept: number;
  redundant: number;
  merged: number;
  deferred: number;
}

/** Outcome of applying one verdict — maps onto a SweepCounts key. */
type VerdictOutcome = keyof SweepCounts;

/**
 * Consolidation sweep job handler (vectorize queue): adjudicates pending
 * ledger inserts of one partition against their near-duplicate candidates
 * with LLM verdicts {keep, redundant, merge}. LLM-judged only — cosine
 * thresholds cannot see negation/polarity flips, so geometric merges are
 * never used.
 *
 * Failure philosophy (matches the write/profile jobs): Qdrant/Postgres/embed
 * errors propagate to BullMQ (retry); a garbage/unparseable verdict for a row
 * is warn + leave pending (self-heals on the next run, never burns retries on
 * a deterministic failure). Rows are marked swept only after processing, so a
 * crash mid-run resumes from the oldest unswept row. Merge/restated records
 * written here are NOT ledger rows (no feedback loop).
 */
@Injectable()
export class MemoryConsolidateJobService {
  private readonly logger = new Logger(MemoryConsolidateJobService.name);

  constructor(
    private readonly adjudicator: ConsolidationAdjudicatorService,
    private readonly ledger: MemoryInsertLedgerRepository,
    private readonly memorySearch: MemorySearchService,
    private readonly memoryRepository: MemoryRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
    private readonly taxonomy: MemoryTaxonomyRepository,
  ) {}

  async execute(data: MemoryConsolidateJobData): Promise<void> {
    const limit = Math.min(data.limit ?? 100, MAX_PENDING_PER_RUN);
    const pending = await this.ledger.listPending(data.memoryPartition, limit);
    if (pending.length === 0) {
      this.logger.debug(
        `memory-consolidate ${data.memoryPartition}: nothing pending`,
      );
      return;
    }

    const counts: SweepCounts = {
      kept: 0,
      redundant: 0,
      merged: 0,
      deferred: 0,
    };
    const touched: TaxonomyLabelEntry[] = [];

    for (const row of pending) {
      const screened = await this.screenCandidates(data, row);
      if (!screened) continue;
      const { source, candidates } = screened;

      const verdict = await this.adjudicator.adjudicate(
        data.model,
        {
          text: row.text,
          role: row.role,
          createdAt: row.createdAt.toISOString(),
          subject: source.subject,
          category: source.category,
          kind: source.kind,
          stability: source.stability,
        },
        candidates.map(mapCandidateToAdjudication),
      );
      if (!verdict) {
        this.logger.warn(
          `memory-consolidate ${data.memoryPartition}: verdict unparseable — row left pending`,
        );
        counts.deferred++;
        continue;
      }

      if (data.dryRun) {
        this.logger.log(
          `memory-consolidate ${data.memoryPartition} [dryRun]: ${verdict.verdict} for "${row.text.slice(0, 80)}"`,
        );
        continue;
      }

      counts[await this.applyVerdict(data, row, source, candidates, verdict)]++;
      for (const involved of [source, ...candidates]) {
        touched.push(
          ...taxonomyLabelEntries({
            cluster: involved.category,
            community: involved.community,
            hub: involved.subject,
          }),
        );
      }
    }

    if (!data.dryRun) {
      await this.stampTouched(data.memoryPartition, touched);
    }

    this.logger.log(
      `memory-consolidate ${data.memoryPartition}: processed ${pending.length} — kept ${counts.kept}, redundant ${counts.redundant}, merged ${counts.merged}, deferred ${counts.deferred}${data.dryRun ? ' (dryRun)' : ''}`,
    );

    if (!data.dryRun) {
      await this.autoTriggerReflect(data.memoryPartition, data.model);
      await this.autoTriggerCluster(data.memoryPartition, data.model);
    }
  }

  /**
   * Auto-trigger the reflection sweep over the partition after a real
   * consolidation run — the newly kept/merged points are unreflected, so the
   * friction screen picks them up. Gated by the partitionReflectAutoEnabled
   * system variable; the model falls back to the consolidation model when no
   * dedicated reflection model is configured.
   */
  /**
   * Stamp `lastConsolidatedAt` on the taxonomy nodes under which the
   * adjudicated points sit (warn-and-continue — stamps are observability,
   * never a failure domain of the sweep).
   */
  private async stampTouched(
    memoryPartition: string,
    touched: TaxonomyLabelEntry[],
  ): Promise<void> {
    if (touched.length === 0) return;
    try {
      await this.taxonomy.touchMaintenanceForLabels(
        'partition',
        memoryPartition,
        touched,
        'lastConsolidatedAt',
        new Date(),
      );
    } catch (error) {
      this.logger.warn(
        `memory-consolidate ${memoryPartition}: maintenance stamps skipped — ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async autoTriggerReflect(
    memoryPartition: string,
    fallbackModel: string,
  ): Promise<void> {
    if (!this.overrides.getPartitionReflectAutoEnabled()) return;
    await this.memoryEnqueue.enqueueReflectJob({
      lane: 'partition',
      scopeKey: memoryPartition,
      model: this.overrides.getReflectModel() ?? fallbackModel,
      limit: this.overrides.getReflectBatchLimit(),
      maxCandidates: this.overrides.getReflectMaxCandidates(),
    });
  }

  /**
   * Auto-trigger the cluster-detection sweep over the partition after a
   * real consolidation run — merges/deletes changed the link graph, so the
   * clusters re-cluster. Gated by clusterAutoEnabled; the model falls
   * back to the consolidation model when no dedicated cluster model is
   * configured.
   */
  private async autoTriggerCluster(
    memoryPartition: string,
    fallbackModel: string,
  ): Promise<void> {
    if (!this.overrides.getClusterAutoEnabled()) return;
    await this.memoryEnqueue.enqueueClusterJob({
      lane: 'partition',
      scopeKey: memoryPartition,
      model: this.overrides.getClusterModel() ?? fallbackModel,
      minMembers: this.overrides.getClusterMinMembers(),
    });
  }

  /**
   * Existence check + near-duplicate screen. Marks the row swept and returns
   * undefined when there is nothing to adjudicate (the point is already gone,
   * or no near-duplicates exist — the fast path skips the LLM call). The
   * returned source point carries the new fact's stored metadata (subject,
   * kind, stability, category) for the adjudication prompt.
   */
  private async screenCandidates(
    data: MemoryConsolidateJobData,
    row: PendingLedgerEntry,
  ): Promise<{ source: MemoryPoint; candidates: MemoryPoint[] } | undefined> {
    const alive = await this.memoryRepository.listMemory({
      memoryPartition: data.memoryPartition,
      text: row.text,
      limit: 1,
    });
    const source = alive[0];
    if (!source) {
      await this.ledger.markSwept([row.id]);
      return undefined;
    }

    const candidates = (
      await this.memorySearch.searchByText({
        memoryPartition: data.memoryPartition,
        text: row.text,
        limit: 5,
      })
    ).filter((point) => point.id !== row.pointId);

    if (candidates.length === 0) {
      await this.ledger.markSwept([row.id]);
      await this.memoryRepository.setPayloadForPoints([row.pointId], {
        is_consolidated: true,
      });
      return undefined;
    }
    return { source, candidates };
  }

  /** Apply one verdict; returns the outcome key for the run tally. */
  private async applyVerdict(
    data: MemoryConsolidateJobData,
    row: PendingLedgerEntry,
    source: MemoryPoint,
    candidates: MemoryPoint[],
    verdict: ConsolidationVerdict,
  ): Promise<VerdictOutcome> {
    if (verdict.verdict === 'keep') {
      await this.ledger.markSwept([row.id]);
      await this.memoryRepository.setPayloadForPoints([row.pointId], {
        is_consolidated: true,
      });
      return 'kept';
    }
    if (verdict.verdict === 'redundant') {
      await this.memoryRepository.deleteByIds([row.pointId]);
      await this.ledger.markSwept([row.id]);
      return 'redundant';
    }

    const mergedText = verdict.mergedText?.trim();
    if (!mergedText) {
      this.logger.warn(
        `memory-consolidate ${data.memoryPartition}: merge verdict without mergedText — row left pending`,
      );
      return 'deferred';
    }
    const role =
      row.role === 'user' || candidates.some((c) => c.role === 'user')
        ? 'user'
        : 'assistant';
    const [vector] = await this.embeddingService.embed(
      [mergedText],
      'document',
    );
    if (!vector) {
      this.logger.warn(
        `memory-consolidate ${data.memoryPartition}: embed returned no vector — row left pending`,
      );
      return 'deferred';
    }
    const id = deterministicPointId(
      `${data.memoryPartition}|${role}|${mergedText}`,
    );
    // Tag/metadata carry: the merged restatement describes the same claim —
    // the new fact's freshly classified metadata wins, the user-side
    // candidate backs it up (its wording survives the merge too), and the
    // tag union includes the new fact's own tags.
    const metaFallback =
      candidates.find((candidate) => candidate.role === 'user') ??
      candidates[0];
    const tags = [
      ...new Set([
        ...(source.tags ?? []),
        ...candidates.flatMap((candidate) => candidate.tags),
      ]),
    ];
    await this.memoryRepository.upsertBatch({
      memoryPartition: data.memoryPartition,
      role,
      requestId: row.requestId,
      points: [
        {
          id,
          vector,
          text: mergedText,
          tags,
          isConsolidated: true,
          category: source.category ?? metaFallback?.category,
          subject: source.subject ?? metaFallback?.subject,
          kind: source.kind ?? metaFallback?.kind,
          stability: source.stability ?? metaFallback?.stability,
        },
      ],
    });
    await this.memoryRepository.deleteByIds([
      row.pointId,
      ...candidates.map((c) => c.id),
    ]);
    await this.ledger.markSwept([row.id]);
    this.logger.log(
      {
        memoryPartition: data.memoryPartition,
        pointId: id,
        mergedText,
        removedPointIds: [row.pointId, ...candidates.map((c) => c.id)],
      },
      'memory-consolidate merged records',
    );
    return 'merged';
  }
}
