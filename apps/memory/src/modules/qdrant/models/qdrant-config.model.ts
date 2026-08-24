export interface QdrantConfig {
  /** Base URL of the Qdrant REST API (port 6333). */
  url: string;
  /** Optional API key for shared/prod deployments (never committed). */
  apiKey?: string;
  /** Name of the collection that holds harness memory points. */
  collection: string;
  /**
   * Dimensionality of the embedding vectors stored in the collection.
   * Defaults to nomic-embed-text-v2-moe's 768 dims; the embedding service
   * (Ticket 5.3) derives this from the configured model at bootstrap — the
   * config value is the fallback until then.
   */
  vectorSize: number;
  /** Embedding model used by the vectorize pipeline (QDRANT_EMBED_MODEL). */
  embedModel: string;
  /**
   * Minimum cosine score for memory search hits (QDRANT_SCORE_THRESHOLD,
   * default 0.5). Below it a result is more noise than recall.
   */
  scoreThreshold: number;
  /**
   * Timeout for the Ollama embed call in ms (QDRANT_EMBED_TIMEOUT_MS,
   * default 60_000). A hung Ollama would otherwise stall a vectorize job
   * until BullMQ stalled-recovery re-runs it — the timeout turns that into a
   * clean transient failure that retries normally.
   */
  embedTimeoutMs: number;
  /** Master switch for the whole memory feature (MEMORY_ENABLED, default off). */
  enabled: boolean;
  /**
   * Character cap for the serialized cognition profile document
   * (MEMORY_COGNITION_LIMIT, default 5000, clamped 500–32000) — the env
   * baseline for the `memoryCognitionLimit` system variable; the SysCtl
   * memory-overrides value wins at runtime.
   */
  cognitionLimit: number;
  /**
   * Pending-inserts per partition that auto-trigger a consolidation sweep
   * (MEMORY_CONSOLIDATE_THRESHOLD, default 50).
   */
  consolidateThreshold: number;
  /**
   * Chat model for sweep adjudication (MEMORY_CONSOLIDATE_MODEL) — no
   * default; the consolidate endpoint body may pass a model instead.
   */
  consolidateModel?: string;
}
