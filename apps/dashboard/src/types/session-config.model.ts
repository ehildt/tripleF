export interface SessionConfig {
  sessionId: string;
  selectedModel?: string | null;
  preprocessing?: Record<string, unknown> | null;
  providerOverrides?: Record<string, unknown> | null;
  /** Memory partition id (settings → system) — the user's memory space; overrides the session id as the memory partition. */
  memoryPartition?: string | null;
  /** Memory cognition id (settings → system) — the AI's understanding-of-the-user space; defaults to the memory partition. */
  memoryCognition?: string | null;
}
