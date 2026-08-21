import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';

import {
  VECTORIZE_QUEUE,
  VECTORIZE_WORKER_CONCURRENCY,
} from '../../bullmq/constants/bullmq.constants.js';
import { LifecycleService } from '../../dead-letter/services/lifecycle.service.js';
import { PinoLoggerService } from '../../pino-logger/services/pino-logger.service.js';
import {
  MEMORY_PROFILE_JOB,
  MEMORY_WRITE_JOB,
  QDRANT_CONFIG,
  VECTORIZE_JOB,
} from '../constants/qdrant.constants.js';
import { isPermanentVectorizeError } from '../helpers/vectorize-failure.helper.js';
import type {
  MemoryProfileJobData,
  MemoryWriteJobData,
  VectorizeJobData,
} from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';
import { MemoryProfileJobService } from '../services/vectorize/jobs/memory-profile-job.service.js';
import { MemoryWriteJobService } from '../services/vectorize/jobs/memory-write-job.service.js';
import { EmbedStepService } from '../services/vectorize/steps/embed-step.service.js';
import { ExtractStepService } from '../services/vectorize/steps/extract-step.service.js';
import { StoreStepService } from '../services/vectorize/steps/store-step.service.js';
import type { VectorizeContext } from '../services/vectorize/vectorize-context.type.js';
import { VectorizeStepEngineService } from '../services/vectorize/vectorize-step-engine.service.js';
import { VectorizeStepRegistryService } from '../services/vectorize/vectorize-step-registry.service.js';

/**
 * BullMQ worker for the vectorize queue — a step machine mirroring
 * HarnessProcessor: the pipeline extract → embed → store runs as
 * registered DAG steps through the vectorize step engine.
 *
 * Semantics: step failures propagate to BullMQ (transient retries, permanent
 * classified into UnrecoverableError) — a memory write is never silently
 * dropped. Lifecycle hooks only log.
 */
@Injectable()
@Processor(VECTORIZE_QUEUE, {
  concurrency: VECTORIZE_WORKER_CONCURRENCY,
})
export class VectorizeProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly bullMQLogger: BullMQLoggerService,
    private readonly logger: PinoLoggerService,
    private readonly stepEngine: VectorizeStepEngineService,
    private readonly stepRegistryService: VectorizeStepRegistryService,
    private readonly extractStep: ExtractStepService,
    private readonly embedStep: EmbedStepService,
    private readonly storeStep: StoreStepService,
    private readonly memoryWriteJob: MemoryWriteJobService,
    private readonly memoryProfileJob: MemoryProfileJobService,
    private readonly dlqLifecycleService: LifecycleService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {
    super();
  }

  onModuleInit(): void {
    this.stepRegistryService
      .addStep('extract', { execute: (ctx) => this.extractStep.execute(ctx) })
      .addStep('embed', { execute: (ctx) => this.embedStep.execute(ctx) }, [
        'extract',
      ])
      .addStep('store', { execute: (ctx) => this.storeStep.execute(ctx) }, [
        'embed',
      ]);
  }

  async process(
    job: Job<VectorizeJobData | MemoryWriteJobData | MemoryProfileJobData>,
  ): Promise<void> {
    // Feature off → no-op (a job can outlive the moment it was enabled).
    if (!this.config.enabled) return;
    // Unknown job names on the shared queue are not ours — never consume them.
    if (
      job.name !== VECTORIZE_JOB &&
      job.name !== MEMORY_WRITE_JOB &&
      job.name !== MEMORY_PROFILE_JOB
    )
      return;

    try {
      // Fact records flow through the extract → embed → store step machine;
      // cognition writes are single-call jobs handled by dedicated services.
      if (job.name === VECTORIZE_JOB) {
        await this.stepEngine.run(
          this.buildContext(job as Job<VectorizeJobData>),
        );
      } else if (job.name === MEMORY_WRITE_JOB) {
        await this.memoryWriteJob.execute(job.data as MemoryWriteJobData);
      } else {
        await this.memoryProfileJob.execute(job.data as MemoryProfileJobData);
      }
    } catch (error) {
      // Config errors (missing embed model, dimension mismatch) can never
      // succeed on retry — record them as final failures in the DLQ (they're
      // unrecoverable at attempt 1, so the failed hook below won't catch them),
      // then fail the job immediately instead of burning three backoff retries.
      const message = error instanceof Error ? error.message : String(error);
      if (isPermanentVectorizeError(error)) {
        await this.dlqLifecycleService.recordPermanentFailure(job, message);
        throw new UnrecoverableError(message);
      }
      throw error;
    }
  }

  private buildContext(job: Job<VectorizeJobData>): VectorizeContext {
    const steps: VectorizeContext['steps'] = new Map();
    for (const id of this.stepRegistryService.registry.keys()) {
      steps.set(id, { status: 'idle' });
    }
    return {
      jobId: String(job.id ?? 'unknown'),
      job,
      memoryPartition: job.data.memoryPartition,
      sessionId: job.data.sessionId,
      role: job.data.role,
      conversationId: job.data.conversationId,
      requestId: job.data.requestId,
      text: job.data.text,
      model: job.data.model,
      steps,
      outputs: {},
      done: false,
    };
  }

  @OnWorkerEvent('completed')
  protected async onCompleted(job: Job<VectorizeJobData>) {
    await this.logToBullMQ(job, 'completed');
    // A reinstated job that now completes clears its Active DLQ entry —
    // the same lifecycle the harness processor runs.
    await this.dlqLifecycleService.onJobCompleted(job);
  }

  @OnWorkerEvent('active')
  protected async onActive(job: Job<VectorizeJobData>) {
    await this.logToBullMQ(job, 'active');
  }

  @OnWorkerEvent('failed')
  protected async onFailed(job: Job<VectorizeJobData>) {
    await this.logFailureToBullMQ(job);
    await this.dlqLifecycleService.onJobFailed();
    await this.dlqLifecycleService.handleFailed(job, job.failedReason);
  }

  private async logToBullMQ(
    job: Job<VectorizeJobData>,
    status: 'completed' | 'active',
  ): Promise<void> {
    try {
      await this.bullMQLogger.log(job, status);
    } catch (err) {
      this.logger.error(`bullMQLogger.log failed in on${status}:`, err);
    }
  }

  private async logFailureToBullMQ(job: Job<VectorizeJobData>): Promise<void> {
    try {
      await this.bullMQLogger.error(job, 'failed');
    } catch (err) {
      this.logger.error('bullMQLogger failed in onFailed:', err);
    }
  }
}
