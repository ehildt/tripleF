import { Injectable } from '@nestjs/common';

import { HarnessContext, StepId, StepState } from './harness-context.type.js';
import { HarnessStepLogger } from './harness-step-logger.service.js';
import { StepRegistry, StepRegistryService } from './step-registry.service.js';

export type { StepRegistry };

@Injectable()
export class HarnessStepEngineService {
  constructor(
    private readonly stepRegistryService: StepRegistryService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  async run(ctx: HarnessContext): Promise<void> {
    while (!this.isGoalFinished(ctx)) {
      const step = this.selectNextStep(ctx, this.stepRegistryService.registry);
      if (!step) {
        this.stepLogger.warn(
          ctx,
          'engine',
          `No runnable step found for ${ctx.requestId}`,
        );
        break;
      }
      await this.executeStep(step, ctx, this.stepRegistryService.registry);
    }
  }

  isGoalFinished(ctx: HarnessContext): boolean {
    if (ctx.done) return true;

    for (const [, state] of ctx.steps)
      if (state.status !== 'done') return false;

    return true;
  }

  selectNextStep(
    ctx: HarnessContext,
    registry: StepRegistry,
  ): StepId | undefined {
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
    stepId: StepId,
    ctx: HarnessContext,
    registry: StepRegistry,
  ): Promise<void> {
    ctx.steps.set(stepId, { status: 'running' } as StepState);

    try {
      const registration = registry.get(stepId);
      if (!registration) throw new Error(`Unknown step: ${stepId}`);

      await registration.handler.execute(ctx);
      ctx.steps.set(stepId, { status: 'done' } as StepState);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.steps.set(stepId, { status: 'error', error: message });
      ctx.done = true;
      ctx.doneReason = 'error';
      ctx.error = message;

      this.stepLogger.error(
        ctx,
        stepId,
        `Step ${stepId} failed for ${ctx.requestId}`,
        error,
      );
    }
  }
}
