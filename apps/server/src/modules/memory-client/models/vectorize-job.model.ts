import type { MemoryRole } from '@triplef/agent/tools';

import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';

/** BullMQ job payload for the vectorize queue (one job per turn-side). */
export interface VectorizeJobData {
  memoryPartition: string;
  role: MemoryRole;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — the request this text came from (traced to the point). */
  requestId?: string;
  text: string;
  /**
   * Harness model that produced the turn — reused for fact extraction.
   * Omitted for manual ingestion: the text is stored verbatim.
   */
  model?: string;
  /** Context size of the originating turn — derives the extract-step valve. */
  numCtx?: number;
  /** Storage urls of the turn's attached files, remembered on every point. */
  files?: Array<{ name: string; url: string }>;
}

/**
 * Cognition-write job: the harness memoryWrite step enqueues it after an
 * answered turn whose intent included a remember tool. The LLM tool loop
 * runs in the vectorize worker — off the harness hot path, with BullMQ
 * retries.
 */
export interface MemoryWriteJobData {
  /** The user's fact partition. */
  memoryPartition: string;
  /** The AI's cognition space key — the cognition-remember lane target. */
  memoryCognition?: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  /** The user prompt of the answered turn. */
  userRequest: string;
  /** Summarized tool results of the turn (pre-capped by the harness step). */
  gathered?: string;
  /**
   * The turn's memory-partition-recall hits (provenance-labeled, pre-capped)
   * — what the probe already surfaced this turn. The write job treats these
   * as ALREADY KNOWN, so it extends/updates instead of re-storing them.
   */
  probedMemory?: string;
  /** Harness model that produced the turn — reused for the write judgment. */
  model: string;
  /** Thinking preference of the originating turn. */
  think?: ThinkMode;
  /** Context size of the originating turn. */
  numCtx?: number;
}

/**
 * Cognition-profile job payload: enqueued after every answered turn
 * (subconscious formation). The worker maintains the structured profile plus
 * derived insight records.
 */
export interface MemoryProfileJobData {
  /** The AI's cognition space key (resolution: memoryCognition override → memoryPartition → sessionId). */
  memoryCognition: string;
  /** The user's fact partition — probed for prior facts so the job can
   *  connect this turn's detail to past user statements. */
  memoryPartition?: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  userRequest: string;
  assistantResponse?: string;
  model: string;
  think?: ThinkMode;
  numCtx?: number;
}
