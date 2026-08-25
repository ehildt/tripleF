import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CoreLoggerService } from '@triplef/core-logger';
import { Job } from 'bullmq';

import {
  HARNESS_QUEUE,
  HARNESS_WORKER_CONCURRENCY,
} from '../../bullmq/constants/bullmq.constants.js';
import { LifecycleService } from '../../dead-letter/services/lifecycle.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { HarnessCancellationService } from '../services/harness-cancellation.service.js';
import { HarnessChatStreamingService } from '../services/harness-chat-streaming.service.js';
import { HarnessContextService } from '../services/harness-context.service.js';
import { HarnessStepEngineService } from '../services/harness-step-engine.service.js';
import { StepRegistryService } from '../services/step-registry.service.js';
import { ExecuteStepService } from '../services/steps/execute-step.service.js';
import { InterpretStepService } from '../services/steps/interpret-step.service.js';
import { MemoryProfileStepService } from '../services/steps/memory-profile-step.service.js';
import { MemoryWriteStepService } from '../services/steps/memory-write-step.service.js';
import { RespondStepService } from '../services/steps/respond-step.service.js';
import { SanitizeStepService } from '../services/steps/sanitize-step.service.js';
import { VectorizeStepService } from '../services/steps/vectorize-step.service.js';

@Injectable()
@Processor(HARNESS_QUEUE, {
  concurrency: HARNESS_WORKER_CONCURRENCY,
})
export class HarnessProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly bullMQLogger: BullMQLoggerService,
    private readonly logger: CoreLoggerService,
    private readonly contextService: HarnessContextService,
    private readonly cancellationService: HarnessCancellationService,
    private readonly stepEngine: HarnessStepEngineService,
    private readonly chatStreaming: HarnessChatStreamingService,
    private readonly interpretStepService: InterpretStepService,
    private readonly executeStepService: ExecuteStepService,
    private readonly respondStepService: RespondStepService,
    private readonly sanitizeStepService: SanitizeStepService,
    private readonly memoryWriteStepService: MemoryWriteStepService,
    private readonly memoryProfileStepService: MemoryProfileStepService,
    private readonly vectorizeStepService: VectorizeStepService,
    private readonly stepRegistryService: StepRegistryService,
    private readonly dlqLifecycleService: LifecycleService,
  ) {
    super();
  }

  onModuleInit(): void {
    this.stepRegistryService
      .addStep('interpret', {
        execute: (ctx) => this.interpretStepService.execute(ctx),
      })
      .addStep(
        'execute',
        { execute: (ctx) => this.executeStepService.execute(ctx) },
        ['interpret'],
      )
      .addStep(
        'sanitize',
        { execute: (ctx) => this.sanitizeStepService.execute(ctx) },
        ['execute'],
      )
      .addStep(
        'respond',
        { execute: (ctx) => this.respondStepService.execute(ctx) },
        ['sanitize'],
      )
      // Memory write runs after the response with the turn's tool results in
      // hand — the execute wave is blind, so a remember call there would
      // store intent-text instead of the data the turn actually gathered.
      // Only fires when the classifier picked memoryRemember and the memory
      // feature is enabled; never fails the turn.
      .addStep(
        'memoryWrite',
        { execute: (ctx) => this.memoryWriteStepService.execute(ctx) },
        ['respond'],
      )
      // Cognition runs last and on EVERY answered turn — derived
      // understanding of the user accrues from ordinary turns, so unlike
      // memoryWrite it is not classifier-gated; one dedicated call with only
      // the turn's two sides and the current document. Never fails the turn.
      .addStep(
        'memoryProfile',
        { execute: (ctx) => this.memoryProfileStepService.execute(ctx) },
        ['memoryWrite'],
      )
      // Memory write runs last, only after the response succeeded (the engine
      // stops on any step failure) — see VectorizeStepService.
      .addStep(
        'vectorize',
        { execute: (ctx) => this.vectorizeStepService.execute(ctx) },
        ['respond'],
      );
  }

  async process(job: Job<HarnessJobPayload>): Promise<void> {
    const ctx = await this.contextService.buildContext(job);
    const controller = this.cancellationService.register(ctx.requestId);
    ctx.abortSignal = controller.signal;

    try {
      await this.stepEngine.run(ctx);
    } finally {
      this.cancellationService.deregister(ctx.requestId, {
        quiet: true,
      });
    }

    // A user cancel aborts the controller with an Error reason; the quiet
    // deregister above only fires when the run finished on its own.
    const cancelledByUser = controller.signal.reason !== 'deregister-quiet';

    // Application-level step failures complete the job (the step engine
    // catches step errors), so they reach the DLQ from the completed hook
    // instead of the failed one. User-cancelled runs are not DLQ material.
    if (ctx.doneReason === 'error' && !cancelledByUser) {
      this.dlqLifecycleService.markApplicationFailure(
        ctx.requestId,
        ctx.error ?? 'An unexpected error occurred',
      );
    }

    await this.chatStreaming.streamResult(ctx);
  }

  /* ── Lifecycle Hooks ──────────────────────────────────────────── */

  @OnWorkerEvent('completed')
  protected async onCompleted(job: Job<HarnessJobPayload>) {
    await this.logToBullMQ(job, 'completed');
    await this.dlqLifecycleService.onJobCompleted(job);
  }

  @OnWorkerEvent('active')
  protected async onActive(job: Job<HarnessJobPayload>) {
    await this.logToBullMQ(job, 'active');
  }

  @OnWorkerEvent('failed')
  protected async onFailed(job: Job<HarnessJobPayload>) {
    await this.logFailureToBullMQ(job);
    await this.dlqLifecycleService.onJobFailed();
    await this.dlqLifecycleService.handleFailed(job, this.getFailedReason(job));
  }

  private async logToBullMQ(
    job: Job<HarnessJobPayload>,
    status: 'completed' | 'active',
  ): Promise<void> {
    try {
      await this.bullMQLogger.log(job, status);
    } catch (err) {
      this.logger.error(`bullMQLogger.log failed in on${status}:`, err);
    }
  }

  private async logFailureToBullMQ(job: Job<HarnessJobPayload>): Promise<void> {
    try {
      const failedReason = this.getFailedReason(job) ?? '';
      if (failedReason.includes('canceled'))
        await this.bullMQLogger.log(job, 'canceled');
      else await this.bullMQLogger.error(job, 'failed');
    } catch (err) {
      this.logger.error('bullMQLogger failed in onFailed:', err);
    }
  }

  private getFailedReason(job: Job<HarnessJobPayload>): string | undefined {
    return job.failedReason;
  }
}
