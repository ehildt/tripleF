import type { MemoryExtraction } from '@triplef/agent/schemas';
import { Job } from 'bullmq';

import type {
  MemoryRole,
  VectorizeJobData,
} from '../../models/memory.model.js';

/**
 * Pipeline ids of the vectorize step machine — mirrors the harness's StepId
 * registry concept: extract → embed → store.
 */
export type VectorizeStepId = 'extract' | 'embed' | 'store';

export type VectorizeStepState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done' }
  | { status: 'error'; error: string };

/** Pipeline context handed through the step engine — mirrors HarnessContext. */
export type VectorizeContext = {
  /** BullMQ job id — correlates step logs with the queue job. */
  jobId: string;
  job: Job<VectorizeJobData>;
  /** Partition key — the user-set partition id when configured, else the session id. */
  memoryPartition: string;
  /** Browser/session the record originated in — provenance only. */
  sessionId?: string;
  role: MemoryRole;
  conversationId?: string;
  /** Harness turn id — lands on every stored point as `request_id`. */
  requestId?: string;
  text: string;
  /** Harness model reused for fact extraction; undefined → no extraction and the text stores nothing (only extracted facts become records). */
  model?: string;
  /** Context size of the originating turn — derives the extract-step valve. */
  numCtx?: number;
  /** Storage urls of the turn's attached files, landed on every point. */
  files?: Array<{ name: string; url: string }>;

  steps: Map<VectorizeStepId, VectorizeStepState>;
  outputs: {
    extraction?: MemoryExtraction;
    vectors?: number[][];
  };

  /** Set by the extract step for an empty turn, or by the engine on failure. */
  done: boolean;
  error?: string;
};
