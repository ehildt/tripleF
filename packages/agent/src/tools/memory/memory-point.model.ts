export type MemoryRole = 'user' | 'assistant';

/**
 * One memory point = one record served by the memory app (mirror of the
 * memory app's MemoryPoint). Kept local so the server's HTTP client and the
 * memory tools stay typed without importing the memory app's code.
 */
export interface MemoryPoint {
  id: string;
  /** Partition key the record belongs to (the user-set partition or session id). */
  memoryPartition?: string;
  /** Cognition key the record belongs to — the AI's own memory space. */
  memoryCognition?: string;
  role: MemoryRole;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  text: string;
  tags: string[];
  /** Cognition insight routing path (e.g. `likes.cars`) — insight records only. */
  path?: string;
  createdAt: string;
  /** Cosine similarity to the query vector — search results only. */
  score?: number;
  /** True once the consolidation sweep has adjudicated this record. */
  isConsolidated?: boolean;
  /** True once the reflection pass has screened this record for friction. */
  isReflected?: boolean;
  /** True while this record is party to an open friction (contested). */
  isFriction?: boolean;
  /** True when a later record superseded this one (stale — excluded from recall). */
  superseded?: boolean;
  /** Record id that superseded this one (audit trail, never deleted). */
  supersededBy?: string;
}
