import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { VECTORIZE_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import {
  MEMORY_CONSOLIDATE_JOB,
  MEMORY_PROFILE_JOB,
  MEMORY_WRITE_JOB,
  QDRANT_CONFIG,
  VECTORIZE_JOB,
} from '../constants/qdrant.constants.js';
import type {
  MemoryConsolidateJobData,
  MemoryProfileJobData,
  MemoryWriteJobData,
  VectorizeJobData,
} from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

interface EnqueueTurnInput {
  /** Fact partition the records belong to; defaults to the session id. */
  memoryPartition?: string;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — traces every stored point back to the user request. */
  requestId?: string;
  model: string;
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
      };
      const jobs: VectorizeJobData[] = [];
      if (input.userText?.trim()) {
        jobs.push({ ...base, role: 'user', text: input.userText });
      }
      if (input.assistantText?.trim()) {
        jobs.push({ ...base, role: 'assistant', text: input.assistantText });
      }
      if (jobs.length === 0) return;
      await this.queue.addBulk(
        jobs.map((data) => ({ name: VECTORIZE_JOB, data })),
      );
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
}
