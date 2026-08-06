import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  HARNESS_QUEUE,
  HARNESS_WORKER_CONCURRENCY,
} from '../../bullmq/constants/bullmq.constants.js';
import { LifecycleService } from '../../dead-letter/services/lifecycle.service.js';
import { PinoLoggerService } from '../../pino-logger/services/pino-logger.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { isCompactTask } from '../helpers/is-compact-task.helper.js';
import { HarnessCancellationService } from '../services/harness-cancellation.service.js';
import { HarnessChatStreamingService } from '../services/harness-chat-streaming.service.js';
import { HarnessCompactService } from '../services/harness-compact.service.js';
import { HarnessContextService } from '../services/harness-context.service.js';
import { HarnessStepEngineService } from '../services/harness-step-engine.service.js';
import { StepRegistryService } from '../services/step-registry.service.js';
import { ExecuteStepService } from '../services/steps/execute-step.service.js';
import { InterpretStepService } from '../services/steps/interpret-step.service.js';
import { RespondStepService } from '../services/steps/respond-step.service.js';
import { SanitizeStepService } from '../services/steps/sanitize-step.service.js';

@Injectable()
@Processor(HARNESS_QUEUE, {
  concurrency: HARNESS_WORKER_CONCURRENCY,
})
export class HarnessProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly bullMQLogger: BullMQLoggerService,
    private readonly logger: PinoLoggerService,
    private readonly contextService: HarnessContextService,
    private readonly cancellationService: HarnessCancellationService,
    private readonly stepEngine: HarnessStepEngineService,
    private readonly chatStreaming: HarnessChatStreamingService,
    private readonly compactService: HarnessCompactService,
    private readonly interpretStepService: InterpretStepService,
    private readonly executeStepService: ExecuteStepService,
    private readonly respondStepService: RespondStepService,
    private readonly sanitizeStepService: SanitizeStepService,
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
      );
  }

  async process(job: Job<HarnessJobPayload>): Promise<void> {
    if (isCompactTask(job)) {
      const requestId = job.name;
      const controller = this.cancellationService.register(requestId);
      try {
        return await this.compactService.runCompact(job, controller.signal);
      } finally {
        this.cancellationService.deregister(requestId, { quiet: true });
      }
    }

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
