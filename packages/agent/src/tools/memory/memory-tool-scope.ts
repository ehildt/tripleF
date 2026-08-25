/**
 * Partition/cognition-scoped binding for the memory tools, threaded per
 * request so a tool can never cross space boundaries.
 */
export interface MemoryToolScope {
  /** Fact partition the tools read from/write to — the user-set partition id when configured, else the session id. */
  memoryPartition: string;
  /** Cognition space key — the AI's understanding-of-the-user lane; falls back to the fact partition. */
  memoryCognition?: string;
  /** Origin session — stored as provenance on remembers. */
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — remembers are traced back to the requesting turn. */
  requestId?: string;
}
