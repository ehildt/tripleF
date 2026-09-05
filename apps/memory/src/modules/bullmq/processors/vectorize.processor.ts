import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BullMQLoggerService } from '@triplef/bullmq-logger';
import { CoreLoggerService } from '@triplef/core-logger';
import { Job, UnrecoverableError } from 'bullmq';

import { LifecycleService } from '../../dead-letter/services/lifecycle.service.js';
import { EncyclopediaClassifyService } from '../../encyclopedia/services/encyclopedia-classify.service.js';
import { EncyclopediaSweepService } from '../../encyclopedia/services/encyclopedia-sweep.service.js';
import { MemoryConvictionService } from '../../memory-cognition/services/memory-conviction.service.js';
import { MemoryProfileJobService } from '../../memory-cognition/services/memory-profile-job.service.js';
import { MemoryClusterJobService } from '../../memory-partition/services/vectorize/jobs/memory-cluster-job.service.js';
import { MemoryConsolidateJobService } from '../../memory-partition/services/vectorize/jobs/memory-consolidate-job.service.js';
import { MemoryReflectService } from '../../memory-partition/services/vectorize/jobs/memory-reflect.service.js';
import { MemoryRelinkJobService } from '../../memory-partition/services/vectorize/jobs/memory-relink-job.service.js';
import { MemoryWriteJobService } from '../../memory-partition/services/vectorize/jobs/memory-write-job.service.js';
import { EmbedStepService } from '../../memory-partition/services/vectorize/steps/embed-step.service.js';
import { ExtractStepService } from '../../memory-partition/services/vectorize/steps/extract-step.service.js';
import { StoreStepService } from '../../memory-partition/services/vectorize/steps/store-step.service.js';
import type { VectorizeContext } from '../../memory-partition/services/vectorize/vectorize-context.type.js';
import { VectorizeStepEngineService } from '../../memory-partition/services/vectorize/vectorize-step-engine.service.js';
import { VectorizeStepRegistryService } from '../../memory-partition/services/vectorize/vectorize-step-registry.service.js';
import { TaxonomyReconcileJobService } from '../../memory-taxonomy/services/taxonomy-reconcile-job.service.js';
import {
  ENCYCLOPEDIA_CLASSIFY_JOB,
  ENCYCLOPEDIA_CONSOLIDATE_JOB,
  ENCYCLOPEDIA_RESEARCH_JOB,
  MEMORY_CLUSTER_JOB,
  MEMORY_CONSOLIDATE_JOB,
  MEMORY_CONVICTION_JOB,
  MEMORY_PROFILE_JOB,
  MEMORY_REFLECT_JOB,
  MEMORY_RELINK_JOB,
  MEMORY_TAXONOMY_RECONCILE_JOB,
  MEMORY_WRITE_JOB,
  QDRANT_CONFIG,
  VECTORIZE_JOB,
} from '../../qdrant/constants/qdrant.constants.js';
import { isPermanentVectorizeError } from '../../qdrant/helpers/vectorize-failure.helper.js';
import type {
  EncyclopediaClassifyJobData,
  EncyclopediaResearchJobData,
  EncyclopediaSweepJobData,
  MemoryClusterJobData,
  MemoryConsolidateJobData,
  MemoryConvictionJobData,
  MemoryProfileJobData,
  MemoryReflectJobData,
  MemoryRelinkJobData,
  MemoryTaxonomyReconcileJobData,
  MemoryWriteJobData,
  VectorizeJobData,
} from '../../qdrant/models/memory.model.js';
import type { QdrantConfig } from '../../qdrant/models/qdrant-config.model.js';
import { ResearchJobService } from '../../research/services/research-job.service.js';
import {
  VECTORIZE_QUEUE,
  VECTORIZE_WORKER_CONCURRENCY,
} from '../constants/bullmq.constants.js';

/** Job names this worker owns on the shared vectorize queue. */
const KNOWN_JOB_NAMES = new Set<string>([
  VECTORIZE_JOB,
  MEMORY_WRITE_JOB,
  MEMORY_PROFILE_JOB,
  MEMORY_CONSOLIDATE_JOB,
  MEMORY_RELINK_JOB,
  MEMORY_TAXONOMY_RECONCILE_JOB,
  MEMORY_REFLECT_JOB,
  MEMORY_CONVICTION_JOB,
  MEMORY_CLUSTER_JOB,
  ENCYCLOPEDIA_CONSOLIDATE_JOB,
  ENCYCLOPEDIA_CLASSIFY_JOB,
  ENCYCLOPEDIA_RESEARCH_JOB,
]);

/** The union of every job payload this worker dispatches. */
type VectorizeJob = Job<
  | VectorizeJobData
  | MemoryWriteJobData
  | MemoryProfileJobData
  | MemoryConsolidateJobData
  | MemoryRelinkJobData
  | MemoryTaxonomyReconcileJobData
  | MemoryReflectJobData
  | MemoryConvictionJobData
  | MemoryClusterJobData
  | EncyclopediaSweepJobData
  | EncyclopediaClassifyJobData
  | EncyclopediaResearchJobData
>;

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
    private readonly logger: CoreLoggerService,
    private readonly stepEngine: VectorizeStepEngineService,
    private readonly stepRegistryService: VectorizeStepRegistryService,
    private readonly extractStep: ExtractStepService,
    private readonly embedStep: EmbedStepService,
    private readonly storeStep: StoreStepService,
    private readonly memoryWriteJob: MemoryWriteJobService,
    private readonly memoryProfileJob: MemoryProfileJobService,
    private readonly memoryConsolidateJob: MemoryConsolidateJobService,
    private readonly memoryRelinkJob: MemoryRelinkJobService,
    private readonly memoryReflectJob: MemoryReflectService,
    private readonly memoryConvictionJob: MemoryConvictionService,
    private readonly memoryClusterJob: MemoryClusterJobService,
    private readonly taxonomyReconcileJob: TaxonomyReconcileJobService,
    private readonly encyclopediaSweepJob: EncyclopediaSweepService,
    private readonly encyclopediaClassifyJob: EncyclopediaClassifyService,
    private readonly researchJob: ResearchJobService,
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

  async process(job: VectorizeJob): Promise<void> {
    // Feature off → no-op (a job can outlive the moment it was enabled).
    if (!this.config.enabled) return;
    // Unknown job names on the shared queue are not ours — never consume them.
    if (!KNOWN_JOB_NAMES.has(job.name)) return;

    try {
      await this.dispatch(job);
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

  /** Route one known job to its handler service (the dispatch table). */
  private async dispatch(job: VectorizeJob): Promise<void> {
    // Fact records flow through the extract → embed → store step machine;
    // cognition writes and the maintenance sweeps are single-call jobs
    // handled by dedicated services.
    if (job.name === VECTORIZE_JOB) {
      await this.stepEngine.run(
        this.buildContext(job as Job<VectorizeJobData>),
      );
    } else if (job.name === MEMORY_WRITE_JOB) {
      await this.memoryWriteJob.execute(job.data as MemoryWriteJobData);
    } else if (job.name === MEMORY_CONSOLIDATE_JOB) {
      await this.memoryConsolidateJob.execute(
        job.data as MemoryConsolidateJobData,
      );
    } else if (job.name === MEMORY_RELINK_JOB) {
      await this.memoryRelinkJob.execute(job.data as MemoryRelinkJobData);
    } else if (job.name === MEMORY_REFLECT_JOB) {
      await this.memoryReflectJob.execute(job.data as MemoryReflectJobData);
    } else if (job.name === MEMORY_CONVICTION_JOB) {
      await this.memoryConvictionJob.execute(
        job.data as MemoryConvictionJobData,
      );
    } else if (job.name === MEMORY_CLUSTER_JOB) {
      await this.memoryClusterJob.execute(job.data as MemoryClusterJobData);
    } else if (job.name === ENCYCLOPEDIA_CONSOLIDATE_JOB) {
      await this.encyclopediaSweepJob.execute(
        job.data as EncyclopediaSweepJobData,
      );
    } else if (job.name === ENCYCLOPEDIA_CLASSIFY_JOB) {
      await this.encyclopediaClassifyJob.execute(
        job.data as EncyclopediaClassifyJobData,
      );
    } else if (job.name === MEMORY_TAXONOMY_RECONCILE_JOB) {
      await this.taxonomyReconcileJob.execute(
        job.data as MemoryTaxonomyReconcileJobData,
      );
    } else if (job.name === ENCYCLOPEDIA_RESEARCH_JOB) {
      await this.researchJob.execute(job.data as EncyclopediaResearchJobData);
    } else {
      await this.memoryProfileJob.execute(job.data as MemoryProfileJobData);
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
      numCtx: job.data.numCtx,
      files: job.data.files,
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
