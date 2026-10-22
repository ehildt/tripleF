import type { MemoryRole } from '@triplef/agent/tools';

import type { ThinkMode } from '../../ollama/types/think-mode.type.js';

/**
 * Boundary of the memory enqueue lane: the input built by the harness's
 * vectorize step and consumed by `MemoryEnqueueService.enqueueTurn` to
 * produce one vectorize job per turn-side, plus the BullMQ job payloads the
 * queue carries. The payload interfaces are wire mirrors of the memory app's
 * `qdrant/models/memory.model.ts` (`VectorizeJobData`, `MemoryProfileJobData`)
 * — the memory app owns the wire; keep the shapes in sync.
 */

/** One harness turn to remember — the producer input `VectorizeJobData` payloads are derived from. */
export interface EnqueueTurnInput {
  /** Fact partition the records belong to; defaults to the session id. */
  memoryPartition?: string;
  /** Originating partition session, when known. */
  sessionId?: string;
  /** Originating conversation, when known. */
  conversationId?: string;
  /** Harness turn id — traces every stored point back to the user request. */
  requestId?: string;
  /** Harness model that produced the turn — reused by the worker for fact extraction. */
  model: string;
  /** Context size of the originating turn — derives the extract-step valve. */
  numCtx?: number;
  /** The user's verbatim message text; skipped when blank. */
  userText?: string;
  /** The assistant's verbatim response text; skipped when blank or when the turn was pure chat (no gathered data, no attachments). */
  assistantText?: string;
  /** The turn's summarized non-memory tool results — the judging context; shared by both turn-side payloads. */
  gathered?: string;
  /** Storage urls of the turn's files, remembered on every stored point. */
  files?: Array<{ name: string; url: string }>;
}

/** BullMQ job payload for the vectorize queue (one job per turn-side). */
export interface VectorizeJobData {
  /** Fact partition the record belongs to. */
  memoryPartition: string;
  /** Turn side this record originates from. */
  role: MemoryRole;
  /** Originating partition session, when known. */
  sessionId?: string;
  /** Originating conversation, when known. */
  conversationId?: string;
  /** Harness turn id — the request this text came from (traced to the point). */
  requestId?: string;
  /** The verbatim turn-side text the worker judges (and extracts from). */
  text: string;
  /** Harness model that produced the turn — reused for the judged extraction. */
  model?: string;
  /** Context size of the originating turn — derives the extract-step valve. */
  numCtx?: number;
  /**
   * The turn's non-memory tool results, summarized and pre-capped by the
   * harness step — the extraction judgment's gathered-data context.
   */
  gathered?: string;
  /** Storage urls of the turn's attached files, remembered on every stored point and named in the judging context. */
  files?: Array<{ name: string; url: string }>;
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
  /** Originating partition session, when known. */
  sessionId?: string;
  /** Originating conversation, when known. */
  conversationId?: string;
  /** Harness turn id — traces the profile update back to the user request. */
  requestId?: string;
  /** The user prompt of the answered turn. */
  userRequest: string;
  /** The assistant's verbatim answer of the turn, when produced. */
  assistantResponse?: string;
  /** Harness model that produced the turn — reused for the profile judgment. */
  model: string;
  /** Thinking preference of the originating turn. */
  think?: ThinkMode;
  /** Context size of the originating turn. */
  numCtx?: number;
}
