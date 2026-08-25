import { Inject, Injectable, Logger } from '@nestjs/common';

import { MemoryInsertLedgerRepository } from '../../../../persistence/services/memory-insert-ledger.repository.js';
import { QDRANT_CONFIG } from '../../../constants/qdrant.constants.js';
import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import type { QdrantConfig } from '../../../models/qdrant-config.model.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import type { VectorizeContext } from '../vectorize-context.type.js';
import type { VectorizeStepHandler } from '../vectorize-step.interface.js';

/**
 * 'store' — assemble one point per extracted fact and upsert. The id is
 * deterministic (seeded on partition + role + fact text), so the same fact
 * restated later overwrites in place — even across browser sessions when a
 * custom partition id is set. The extraction's topic tags land on every point
 * of the turn-side, powering topic-filtered recall.
 */
@Injectable()
export class StoreStepService implements VectorizeStepHandler {
  private readonly logger = new Logger(StoreStepService.name);

  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly ledger: MemoryInsertLedgerRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  async execute(ctx: VectorizeContext): Promise<void> {
    const extraction = ctx.outputs.extraction ?? { facts: [], tags: [] };
    const vectors = ctx.outputs.vectors ?? [];

    const points = extraction.facts.map((fact, index) => ({
      id: deterministicPointId(`${ctx.memoryPartition}|${ctx.role}|${fact}`),
      vector: vectors[index],
      text: fact,
      tags: extraction.tags,
      // One broad family label per turn-side — groups the narrow tags into
      // one topic family for the constellation community tier and the relink
      // job's per-category passes.
      category: extraction.category,
    }));
    if (points.length === 0) return;

    await this.memoryRepository.upsertBatch({
      memoryPartition: ctx.memoryPartition,
      role: ctx.role,
      sessionId: ctx.sessionId,
      conversationId: ctx.conversationId,
      requestId: ctx.requestId,
      files: ctx.files,
      points,
    });
    this.logger.log(
      {
        jobId: ctx.jobId,
        requestId: ctx.requestId,
        step: 'store',
        points: points.map((point) => ({
          id: point.id,
          text: point.text,
          tags: point.tags,
        })),
      },
      `stored ${points.length} memory points`,
    );

    // Ledger: one row per stored point — the sweep's incremental input.
    // Warn-and-continue: missing ledger rows degrade to no-sweep-coverage,
    // never a failed write.
    try {
      await this.ledger.insertMany(
        points.map((point) => ({
          memoryPartition: ctx.memoryPartition,
          pointId: point.id,
          role: ctx.role,
          text: point.text,
          requestId: ctx.requestId,
        })),
      );
      // Auto-trigger: cross the pending threshold → enqueue a consolidation
      // sweep. Fixed jobId per partition dedupes concurrent enqueues in BullMQ.
      if (
        (await this.ledger.countPending(ctx.memoryPartition)) >=
        this.config.consolidateThreshold
      ) {
        if (!this.config.consolidateModel) {
          this.logger.warn(
            { jobId: ctx.jobId, requestId: ctx.requestId, step: 'store' },
            'consolidation auto-trigger skipped: MEMORY_CONSOLIDATE_MODEL unset',
          );
        } else {
          await this.memoryEnqueue.enqueueConsolidateJob({
            memoryPartition: ctx.memoryPartition,
            model: this.config.consolidateModel,
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        {
          jobId: ctx.jobId,
          requestId: ctx.requestId,
          step: 'store',
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'ledger write/auto-trigger skipped',
      );
    }
  }
}
