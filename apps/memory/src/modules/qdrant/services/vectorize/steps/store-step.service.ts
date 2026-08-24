import { Inject, Injectable } from '@nestjs/common';

import { MemoryInsertLedgerRepository } from '../../../../persistence/services/memory-insert-ledger.repository.js';
import { QDRANT_CONFIG } from '../../../constants/qdrant.constants.js';
import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import type { QdrantConfig } from '../../../models/qdrant-config.model.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemoryEnqueueService } from '../../memory-enqueue.service.js';
import type { VectorizeContext } from '../vectorize-context.type.js';
import type { VectorizeStepHandler } from '../vectorize-step.interface.js';
import { VectorizeStepLogger } from '../vectorize-step-logger.service.js';

/**
 * 'store' — assemble one point per extracted fact and upsert. The id is
 * deterministic (seeded on partition + role + fact text), so the same fact
 * restated later overwrites in place — even across browser sessions when a
 * custom partition id is set. The extraction's topic tags land on every point
 * of the turn-side, powering topic-filtered recall.
 */
@Injectable()
export class StoreStepService implements VectorizeStepHandler {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly stepLogger: VectorizeStepLogger,
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
    }));
    if (points.length === 0) return;

    await this.memoryRepository.upsertBatch({
      memoryPartition: ctx.memoryPartition,
      role: ctx.role,
      sessionId: ctx.sessionId,
      conversationId: ctx.conversationId,
      requestId: ctx.requestId,
      points,
    });
    this.stepLogger.log(ctx, 'store', `stored ${points.length} memory points`);

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
          this.stepLogger.warn(
            ctx,
            'store',
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
      this.stepLogger.warn(
        ctx,
        'store',
        `ledger write/auto-trigger skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
