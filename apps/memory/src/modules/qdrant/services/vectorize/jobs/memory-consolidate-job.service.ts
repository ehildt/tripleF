import { Injectable, Logger } from '@nestjs/common';
import type { ConsolidationVerdict } from '@triplef/agent/schemas';

import type { PendingLedgerEntry } from '../../../../persistence/services/memory-insert-ledger.repository.js';
import { MemoryInsertLedgerRepository } from '../../../../persistence/services/memory-insert-ledger.repository.js';
import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import type {
  MemoryConsolidateJobData,
  MemoryPoint,
} from '../../../models/memory.model.js';
import { ConsolidationAdjudicatorService } from '../../consolidation-adjudicator.service.js';
import { EmbeddingService } from '../../embedding.service.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemorySearchService } from '../../memory-search.service.js';
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

    for (const row of pending) {
      const candidates = await this.screenCandidates(data, row);
      if (!candidates) continue;

      const verdict = await this.adjudicator.adjudicate(
        data.model,
        {
          text: row.text,
          role: row.role,
          createdAt: row.createdAt.toISOString(),
        },
        candidates.map((c) => ({
          text: c.text,
          role: c.role,
          createdAt: c.createdAt,
        })),
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

      counts[await this.applyVerdict(data, row, candidates, verdict)]++;
    }

    this.logger.log(
      `memory-consolidate ${data.memoryPartition}: processed ${pending.length} — kept ${counts.kept}, redundant ${counts.redundant}, merged ${counts.merged}, deferred ${counts.deferred}${data.dryRun ? ' (dryRun)' : ''}`,
    );
  }

  /**
   * Existence check + near-duplicate screen. Marks the row swept and returns
   * undefined when there is nothing to adjudicate (the point is already gone,
   * or no near-duplicates exist — the fast path skips the LLM call).
   */
  private async screenCandidates(
    data: MemoryConsolidateJobData,
    row: PendingLedgerEntry,
  ): Promise<MemoryPoint[] | undefined> {
    const alive = await this.memoryRepository.listMemory({
      memoryPartition: data.memoryPartition,
      text: row.text,
      limit: 1,
    });
    if (alive.length === 0) {
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
      return undefined;
    }
    return candidates;
  }

  /** Apply one verdict; returns the outcome key for the run tally. */
  private async applyVerdict(
    data: MemoryConsolidateJobData,
    row: PendingLedgerEntry,
    candidates: MemoryPoint[],
    verdict: ConsolidationVerdict,
  ): Promise<VerdictOutcome> {
    if (verdict.verdict === 'keep') {
      await this.ledger.markSwept([row.id]);
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
    const tags = [...new Set(candidates.flatMap((c) => c.tags))];
    await this.memoryRepository.upsertBatch({
      memoryPartition: data.memoryPartition,
      role,
      requestId: row.requestId,
      points: [{ id, vector, text: mergedText, tags }],
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
