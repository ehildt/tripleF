import { Injectable } from '@nestjs/common';

import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
import { MemoryRepository } from '../../memory.repository.js';
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
  }
}
