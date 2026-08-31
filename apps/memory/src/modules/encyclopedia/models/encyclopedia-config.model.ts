export interface EncyclopediaConfig {
  /** Master switch for the select endpoint (ENCYCLOPEDIA_SELECT_ENABLED, default true). */
  selectEnabled: boolean;
  /**
   * Fallback selection budget in chars when the caller omits `budgetChars`
   * (ENCYCLOPEDIA_BUDGET_CHARS, default 48000).
   */
  budgetChars: number;
  /**
   * Max chars per chunk (sentence-packed) — a retrieval-granularity knob,
   * not context-bound (ENCYCLOPEDIA_CHUNK_CHARS, default 1600).
   */
  chunkChars: number;
  /** Sentence overlap between adjacent chunks (ENCYCLOPEDIA_CHUNK_OVERLAP_SENTENCES, default 1). */
  chunkOverlapSentences: number;
  /** Cosine floor; below it a chunk is noise (ENCYCLOPEDIA_SCORE_THRESHOLD, default 0.25). */
  scoreThreshold: number;
  /** Safety bound on the embed batch (ENCYCLOPEDIA_MAX_CHUNKS, default 400). */
  maxChunks: number;
  /**
   * Master switch for persistence (ENCYCLOPEDIA_PERSIST_ENABLED, default true).
   * false = exact Phase B behavior: ephemeral selection, nothing stored.
   */
  persistEnabled: boolean;
  /**
   * Max global-probe passages returned per select (ENCYCLOPEDIA_PROBE_LIMIT,
   * default 3) — the past-research lane, mirroring the episode probe's
   * count cap. Each passage is at most `chunkChars` (plus neighbor expansion).
   */
  probeLimit: number;
  /**
   * Chunks before/after a probe hit to include (ENCYCLOPEDIA_NEIGHBOR_EXPANSION,
   * default 1, clamp 0–3) — the get_context-style context window.
   */
  neighborExpansion: number;
  /**
   * Absolute oversize ceiling (ENCYCLOPEDIA_MAX_DOCUMENT_CHARS, default 4_000_000,
   * clamp 100_000–16_000_000). Documents over it are REJECTED from the index
   * (never truncated) — ChatGPT's reject-rather-than-truncate lesson — but
   * still used ephemerally for the live turn.
   */
  maxDocumentChars: number;
  /**
   * Pending-document threshold that auto-triggers the supersede sweep
   * (ENCYCLOPEDIA_CONSOLIDATE_THRESHOLD, default 200).
   */
  consolidateThreshold: number;
  /**
   * Chat model for the classification job (ENCYCLOPEDIA_CLASSIFY_MODEL) — no
   * default; the classify endpoint body may pass a model instead.
   */
  classifyModel?: string;
  /**
   * Pending-document threshold that auto-triggers the classification job
   * (ENCYCLOPEDIA_CLASSIFY_THRESHOLD, default 20).
   */
  classifyThreshold: number;
}
