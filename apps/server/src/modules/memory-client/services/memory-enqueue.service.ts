import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { VECTORIZE_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import type { MemoryClientConfig } from '../configs/memory-client-config.adapter.js';
import {
  MEMORY_CLIENT_CONFIG,
  MEMORY_PROFILE_JOB,
  MEMORY_WRITE_JOB,
} from '../constants/memory-client.constants.js';
import type {
  MemoryProfileJobData,
  MemoryWriteJobData,
  VectorizeJobData,
} from '../models/vectorize-job.model.js';

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
  /** Storage urls of the turn's files, remembered on every stored point. */
  files?: Array<{ name: string; url: string }>;
}

/**
 * Fire-and-forget write path from the harness: enqueues one vectorize job
 * per turn-side (user message, assistant response) onto the shared BullMQ
 * `vectorize` queue. The memory app runs the worker — this producer never
 * waits on embedding or fact extraction. Errors are swallowed — memory is a
 * background concern and must never break the request path.
 */
@Injectable()
export class MemoryEnqueueService {
  private readonly logger = new Logger(MemoryEnqueueService.name);

  constructor(
    @InjectQueue(VECTORIZE_QUEUE) private readonly queue: Queue,
    @Inject(MEMORY_CLIENT_CONFIG) private readonly config: MemoryClientConfig,
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
        files: input.files,
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
   * this payload — the LLM tool loop then runs in the memory-app worker.
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
}
