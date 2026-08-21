import { Injectable } from '@nestjs/common';

import type {
  VectorizeContext,
  VectorizeStepId,
  VectorizeStepState,
} from './vectorize-context.type.js';
import { VectorizeStepLogger } from './vectorize-step-logger.service.js';
import {
  type VectorizeStepRegistry,
  VectorizeStepRegistryService,
} from './vectorize-step-registry.service.js';

/**
 * DAG step runner for the vectorize pipeline — mirrors HarnessStepEngineService
 * (idle step → deps done → execute → status transition).
 *
 * Deliberate difference from the harness engine: a step failure RETHROWS. The
 * harness swallows step errors because the turn must complete (and its DLQ
 * lifecycle reinstates from the completed hook); a vectorize queue job has no
 * such path, so the exception must reach BullMQ — transient failures retry
 * (exponential backoff), permanent ones are classified into UnrecoverableError
 * by the processor. The pipeline never silently drops a memory write.
 */
@Injectable()
export class VectorizeStepEngineService {
  constructor(
    private readonly stepRegistryService: VectorizeStepRegistryService,
    private readonly stepLogger: VectorizeStepLogger,
  ) {}

  async run(ctx: VectorizeContext): Promise<void> {
    while (!this.isGoalFinished(ctx)) {
      const step = this.selectNextStep(ctx, this.stepRegistryService.registry);
      if (!step) {
        this.stepLogger.warn(
          ctx,
          'engine',
          `No runnable step found for job ${ctx.jobId}`,
        );
        break;
      }
      await this.executeStep(step, ctx, this.stepRegistryService.registry);
    }
  }

  isGoalFinished(ctx: VectorizeContext): boolean {
    if (ctx.done) return true;
    for (const [, state] of ctx.steps)
      if (state.status !== 'done') return false;
    return true;
  }

  selectNextStep(
    ctx: VectorizeContext,
    registry: VectorizeStepRegistry,
  ): VectorizeStepId | undefined {
    for (const [id, { deps }] of registry) {
      const current = ctx.steps.get(id);
      if (!current || current.status !== 'idle') continue;

      const depsDone = deps.every(
        (dep) => ctx.steps.get(dep)?.status === 'done',
      );
      if (depsDone) return id;
    }

    return undefined;
  }

  async executeStep(
    stepId: VectorizeStepId,
    ctx: VectorizeContext,
    registry: VectorizeStepRegistry,
  ): Promise<void> {
    ctx.steps.set(stepId, { status: 'running' } as VectorizeStepState);

    try {
      const registration = registry.get(stepId);
      if (!registration) throw new Error(`Unknown step: ${stepId}`);

      await registration.handler.execute(ctx);
      ctx.steps.set(stepId, { status: 'done' } as VectorizeStepState);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.steps.set(stepId, { status: 'error', error: message });
      ctx.done = true;
      ctx.error = message;

      this.stepLogger.error(
        ctx,
        stepId,
        `Step ${stepId} failed for job ${ctx.jobId}`,
        error,
      );
      // Rethrow: BullMQ's retry/classification must see transient failures.
      throw error;
    }
  }
}
