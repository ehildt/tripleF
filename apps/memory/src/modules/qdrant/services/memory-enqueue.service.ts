import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { VECTORIZE_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
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
} from '../constants/qdrant.constants.js';
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
} from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { mapVectorizeJob } from './helpers/map-vectorize-job.helper.js';

interface EnqueueTurnInput {
  /** Fact partition the records belong to; defaults to the session id. */
  memoryPartition?: string;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — traces every stored point back to the user request. */
  requestId?: string;
  model: string;
  /** Context size of the originating turn — derives the extract-step valve. */
  numCtx?: number;
  userText?: string;
  assistantText?: string;
}

/**
 * Fire-and-forget write path from the harness: enqueues one vectorize job
 * per turn-side (user message, assistant response) so the harness processor
 * never waits on embedding or fact extraction. Errors are swallowed — memory
 * is a background concern and must never break the request path.
 */
@Injectable()
export class MemoryEnqueueService {
  private readonly logger = new Logger(MemoryEnqueueService.name);

  constructor(
    @InjectQueue(VECTORIZE_QUEUE) private readonly queue: Queue,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  async enqueueTurn(input: EnqueueTurnInput): Promise<void> {
    if (!this.config.enabled) return;
    const memoryPartition = input.memoryPartition ?? input.sessionId;
    // Memory is partition-scoped; without any id there is nowhere to recall
    // from — a request-id fallback would mint one-shot partitions that are
    // never read back.
    if (!memoryPartition) return;
    try {
      const base = {
        memoryPartition,
        sessionId: input.sessionId,
        conversationId: input.conversationId,
        requestId: input.requestId,
        model: input.model,
        numCtx: input.numCtx,
      };
      const jobs: VectorizeJobData[] = [];
      if (input.userText?.trim()) {
        jobs.push({ ...base, role: 'user', text: input.userText });
      }
      if (input.assistantText?.trim()) {
        jobs.push({ ...base, role: 'assistant', text: input.assistantText });
      }
      if (jobs.length === 0) return;
      await this.queue.addBulk(jobs.map(mapVectorizeJob));
    } catch (error) {
      this.logger.warn(
        `Memory enqueue failed — memory will be skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Cognition write job: the harness memoryWrite step's whole job is to build
   * this payload — the LLM tool loop then runs in the vectorize worker.
   */
  async enqueueWriteJob(data: MemoryWriteJobData): Promise<void> {
    if (!this.config.enabled) return;
    try {
      await this.queue.add(MEMORY_WRITE_JOB, data);
    } catch (error) {
      this.logger.warn(
        `Memory-write enqueue failed — write skipped for ${data.requestId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Cognition profile job: enqueued after every answered turn (subconscious
   * formation). The worker maintains the structured profile + insight records.
   */
  async enqueueProfileJob(data: MemoryProfileJobData): Promise<void> {
    if (!this.config.enabled) return;
    try {
      await this.queue.add(MEMORY_PROFILE_JOB, data);
    } catch (error) {
      this.logger.warn(
        `Memory-profile enqueue failed — update skipped for ${data.requestId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Consolidation sweep trigger: webhook or pending-threshold enqueue. The
   * fixed jobId lets BullMQ dedupe concurrent triggers for one partition
   * while a sweep is already queued or running.
   */
  async enqueueConsolidateJob(data: MemoryConsolidateJobData): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Consolidate enqueue skipped: no model (set MEMORY_CONSOLIDATE_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(MEMORY_CONSOLIDATE_JOB, data, {
        jobId: `consolidate-${data.memoryPartition}-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Consolidate enqueue failed for ${data.memoryPartition}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Relink sweep trigger: endpoint-only (manual ops job — LLM cost is
   * O(points × passes), so it is never auto-triggered). The fixed jobId lets
   * BullMQ dedupe concurrent triggers for one partition.
   */
  async enqueueRelinkJob(data: MemoryRelinkJobData): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Relink enqueue skipped: no model (set MEMORY_CONSOLIDATE_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(MEMORY_RELINK_JOB, data, {
        jobId: `relink-${data.memoryPartition}-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Relink enqueue failed for ${data.memoryPartition}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Taxonomy reconciliation trigger: endpoint-only (manual ops job — the
   * ambiguous-band verdicts are O(pairs) LLM calls, so it is never
   * auto-triggered). The fixed jobId lets BullMQ dedupe concurrent triggers
   * for one lane+scope while a sweep is already queued or running.
   */
  async enqueueTaxonomyReconcileJob(
    data: MemoryTaxonomyReconcileJobData,
  ): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Taxonomy-reconcile enqueue skipped: no model (set MEMORY_CONSOLIDATE_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(MEMORY_TAXONOMY_RECONCILE_JOB, data, {
        jobId: `taxonomy-reconcile-${data.lane}-${data.scopeKey}-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Taxonomy-reconcile enqueue failed for ${data.lane}/${data.scopeKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Encyclopedia supersede sweep trigger: threshold auto-trigger or webhook. The
   * encyclopedia is global, so the jobId is a singleton (no partition suffix).
   */
  async enqueueEncyclopediaSweep(
    data: EncyclopediaSweepJobData,
  ): Promise<void> {
    if (!this.config.enabled) return;
    try {
      await this.queue.add(ENCYCLOPEDIA_CONSOLIDATE_JOB, data, {
        jobId: `encyclopedia-consolidate-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Encyclopedia sweep enqueue failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Encyclopedia classification trigger: threshold auto-trigger or webhook. The
   * encyclopedia is global, so the jobId is a singleton (no partition suffix).
   */
  async enqueueEncyclopediaClassify(
    data: EncyclopediaClassifyJobData,
  ): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Encyclopedia classify enqueue skipped: no model (set ENCYCLOPEDIA_CLASSIFY_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(ENCYCLOPEDIA_CLASSIFY_JOB, data, {
        jobId: `encyclopedia-classify-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Encyclopedia classify enqueue failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Reflection trigger: auto-trigger after a lane's upstream job completes,
   * or the manual endpoint. The fixed jobId dedupes concurrent triggers for
   * one lane+scope while a sweep is already queued or running.
   */
  async enqueueReflectJob(data: MemoryReflectJobData): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Reflect enqueue skipped: no model (set MEMORY_REFLECT_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(MEMORY_REFLECT_JOB, data, {
        jobId: `reflect-${data.lane}-${data.scopeKey}-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Reflect enqueue failed for ${data.lane}/${data.scopeKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Conviction-synthesis trigger: auto-trigger after a partition's
   * reflection sweep, or the manual endpoint. The fixed jobId dedupes
   * concurrent triggers for one partition while a run is already queued or
   * running.
   */
  async enqueueConvictionJob(data: MemoryConvictionJobData): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Conviction enqueue skipped: no model (set MEMORY_CONVICTION_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(MEMORY_CONVICTION_JOB, data, {
        jobId: `conviction-${data.memoryPartition}-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Conviction enqueue failed for ${data.memoryPartition}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Cluster-detection trigger: auto-trigger after a lane's graph-mutating
   * job completes (consolidate/relink/conviction for partition, classify for
   * encyclopedia), or the manual endpoint. The fixed jobId dedupes concurrent
   * triggers for one lane+scope while a run is already queued or running.
   */
  async enqueueClusterJob(data: MemoryClusterJobData): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Cluster enqueue skipped: no model (set MEMORY_CLUSTER_MODEL or pass one)',
      );
      return;
    }
    try {
      await this.queue.add(MEMORY_CLUSTER_JOB, data, {
        jobId: `cluster-${data.lane}-${data.scopeKey}-${data.dryRun ? 'dry' : 'apply'}`,
      });
    } catch (error) {
      this.logger.warn(
        `Cluster enqueue failed for ${data.lane}/${data.scopeKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Gap-filling research trigger: manual endpoint (root sweep) or a chain's
   * own follow-up enqueue (depth+1). The root jobId is a singleton; follow-up
   * jobs dedupe per chain+depth so a re-triggered chain never double-runs.
   */
  async enqueueResearchJob(data: EncyclopediaResearchJobData): Promise<void> {
    if (!this.config.enabled) return;
    if (!data.model) {
      this.logger.warn(
        'Research enqueue skipped: no model (set RESEARCH_MODEL or pass one)',
      );
      return;
    }
    try {
      const jobId = data.chainId
        ? `research-${data.chainId}-${data.depth ?? 0}`
        : `research-root-${data.dryRun ? 'dry' : 'apply'}`;
      await this.queue.add(ENCYCLOPEDIA_RESEARCH_JOB, data, { jobId });
    } catch (error) {
      this.logger.warn(
        `Research enqueue failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
