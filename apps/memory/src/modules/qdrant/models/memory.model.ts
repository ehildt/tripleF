import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';

export type MemoryRole = 'user' | 'assistant';

/**
 * One memory point = one record: an extracted fact from a turn, an explicitly
 * remembered statement, or the AI's cognition document. The text IS the
 * record — the conversation transcript already lives in the harness history,
 * so memory stores only the semantic layer worth recalling later.
 *
 * Every point belongs to exactly one space, identified by its key:
 * - `memoryPartition` — the user's fact space (statements they made or asked
 *   to remember; written by the turn pipeline and the remember tool).
 * - `memoryCognition` — the AI's cognition space: one living document per key
 *   holding the assistant's accumulated, derived understanding of the user
 *   (traits, likes/dislikes, communication style), rewritten over time.
 */
export interface MemoryPoint {
  id: string;
  /**
   * Partition key the record belongs to. Defaults to the caller's session id;
   * a user-set partition id (sysctl) survives browser-session rotation, so
   * memory follows the human, not the tab.
   */
  memoryPartition?: string;
  /**
   * Cognition key the record belongs to — the AI's own memory space of its
   * understanding of this user. Set instead of `memoryPartition`, never both.
   */
  memoryCognition?: string;
  role: MemoryRole;
  /** Browser/session the record originated in — provenance + optional tightening. */
  sessionId?: string;
  /** Conversation/room the record originated in — provenance + optional tightening. */
  conversationId?: string;
  /** Harness turn id — traces the record back to the request that created it. */
  requestId?: string;
  /** The record text (extracted fact, verbatim remember, or cognition document). */
  text: string;
  /** Topic labels written by the extraction pass or the remember tool — keyword bag for payload-filtered recall. */
  tags: string[];
  /**
   * Cognition insight routing path (e.g. `likes.cars`) — the profile facet
   * this insight deepens. Set on insight records only; the respond-time
   * probe token-matches profile values against the prompt to shape the
   * query for the matching paths. Normalized at write time to the canonical
   * probe format (lowercase, dash-joined segments — see normalizeInsightPath).
   * Observability + future hard filtering.
   */
  path?: string;
  createdAt: string;
  /** Cosine similarity to the query vector — search results only. */
  score?: number;
}

/** Optional tightening filters on a memory read (search + list share them). */
export interface MemoryScopeFilters {
  /** Narrow to one user's fact space; the agentic tools always pass the turn's partition. */
  memoryPartition?: string;
  /** Narrow to the AI's cognition space for a user (the living cognition document). */
  memoryCognition?: string;
  sessionId?: string;
  role?: MemoryRole;
  conversationId?: string;
  requestId?: string;
  /** Points whose `tags` include ANY of these labels. */
  tags?: string[];
  /** Full-text containment on the text payload (Qdrant `match: text`). */
  contains?: string;
  /** Exact full-string equality on the record text — the record's identity for deletion. */
  text?: string;
}

export interface UpsertBatchInput {
  /** User fact-space key — set for fact records. */
  memoryPartition?: string;
  /** Cognition-space key — set for the living cognition document. */
  memoryCognition?: string;
  role: MemoryRole;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — lands on every point's payload as `request_id`. */
  requestId?: string;
  points: Array<{
    id: string;
    vector: number[];
    text: string;
    tags?: string[];
    /** Cognition insight routing path (`likes.cars`) — insight records only. */
    path?: string;
  }>;
}

export interface SearchMemoryInput extends MemoryScopeFilters {
  vector: number[];
  limit?: number;
  /**
   * Blend recency into the ranking (formula query with exp_decay on
   * `created_at`): recent points rank higher, older points still surface on
   * a strong topical match. Used by the episode probe.
   */
  recency?: boolean;
}

export interface ListMemoryInput extends MemoryScopeFilters {
  /** Scroll page size, capped at 100. */
  limit?: number;
}

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
}

/**
 * Cognition-write job: the harness memoryWrite step enqueues it after an
 * answered turn whose intent included memoryRemember. The LLM tool loop runs
 * in the vectorize worker — off the harness hot path, with BullMQ retries.
 */
export interface MemoryWriteJobData {
  /** The user's fact partition. */
  memoryPartition: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  /** The user prompt of the answered turn. */
  userRequest: string;
  /** Summarized tool results of the turn (pre-capped by the harness step). */
  gathered?: string;
  /**
   * The turn's memoryRecall hits (provenance-labeled, pre-capped) — what the
   * probe already surfaced this turn. Treated as ALREADY KNOWN: extend or
   * update, never re-store.
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
 * Cognition-profile job: the harness memoryProfile step enqueues it after
 * every answered turn (subconscious formation — never classifier-gated). The
 * worker maintains the structured profile plus derived insight records.
 */
export interface MemoryProfileJobData {
  /** The AI's cognition space key (resolution: memoryCognition override → memoryPartition → sessionId). */
  memoryCognition: string;
  /**
   * The user's fact partition — probed for PRIOR FACTS so the job can
   * connect this turn's detail to statements the user made in past
   * conversations (derived, hedged insights only — never collapsed into
   * claims the user never made).
   */
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

/**
 * Consolidate sweep job payload: adjudicate pending ledger inserts of one
 * partition against their near-duplicates (LLM verdicts keep/redundant/merge).
 */
export interface MemoryConsolidateJobData {
  /** The user's fact partition to sweep. */
  memoryPartition: string;
  /** Chat model for the merge verdicts (resolved at enqueue: body model or MEMORY_CONSOLIDATE_MODEL). */
  model: string;
  /** Max pending inserts processed per run (default 100, capped 500). */
  limit?: number;
  /** Compute and log verdicts without applying or marking anything. */
  dryRun?: boolean;
}
