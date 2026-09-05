export interface QdrantConfig {
  /** Base URL of the Qdrant REST API (port 6333). */
  url: string;
  /** Optional API key for shared/prod deployments (never committed). */
  apiKey?: string;
  /** Name of the collection that holds harness memory points. */
  collection: string;
  /**
   * Name of the collection that holds the shared knowledge encyclopedia
   * (ENCYCLOPEDIA_COLLECTION, default `memory-encyclopedia`) — model-namespaced like
   * the episodic collection. Global scope: public web content, shared across
   * partitions.
   */
  encyclopediaCollection: string;
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
   * default 0.3). Below it a result is more noise than recall. Calibrated
   * for nomic-embed-text-v2-moe, whose sentence-pair cosines cluster lower
   * than the 0.5 the collection originally assumed.
   */
  scoreThreshold: number;
  /**
   * Timeout for the Ollama embed call in ms (QDRANT_EMBED_TIMEOUT_MS,
   * default 60_000). A hung Ollama would otherwise stall a vectorize job
   * until BullMQ stalled-recovery re-runs it — the timeout turns that into a
   * clean transient failure that retries normally.
   */
  embedTimeoutMs: number;
  /** Master switch for the whole memory feature (MEMORY_ENABLED, default on). */
  enabled: boolean;
  /**
   * Character cap for the serialized cognition profile document
   * (MEMORY_COGNITION_LIMIT, default 5000, clamped 500–32000) — the env
   * baseline for the `memoryCognitionLimit` system variable; the Settings
   * memory-overrides value wins at runtime.
   */
  cognitionLimit: number;
  /**
   * Max fact records the constellation loads per space
   * (MEMORY_CONSTELLATION_NODE_LIMIT, default 5000, clamped 100–10000) —
   * the env baseline for the `constellationNodeLimit` system variable; the
   * Settings memory-overrides value wins at runtime.
   */
  constellationNodeLimit: number;
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
  /**
   * Chat model for the reflection pass's friction verdicts
   * (MEMORY_REFLECT_MODEL) — no default; the reflect endpoint body may pass
   * a model instead.
   */
  reflectModel?: string;
  /**
   * Max unreflected points screened per reflection run
   * (MEMORY_REFLECT_BATCH_LIMIT, default 100, clamped 1–500).
   */
  reflectBatchLimit: number;
  /**
   * Max near-neighbor candidates per point in the friction screen
   * (MEMORY_REFLECT_MAX_CANDIDATES, default 5, clamped 1–100).
   */
  reflectMaxCandidates: number;
  /**
   * Auto-trigger reflection after a partition's consolidation sweep
   * (MEMORY_PARTITION_REFLECT_AUTO, default false).
   */
  partitionReflectAutoEnabled: boolean;
  /**
   * Auto-trigger reflection after a cognition profile job
   * (MEMORY_COGNITION_REFLECT_AUTO, default false).
   */
  cognitionReflectAutoEnabled: boolean;
  /**
   * Auto-trigger reflection after the encyclopedia classification job
   * (MEMORY_ENCYCLOPEDIA_REFLECT_AUTO, default false).
   */
  encyclopediaReflectAutoEnabled: boolean;
  /**
   * Chat model for the conviction-synthesis pass (MEMORY_CONVICTION_MODEL) —
   * no default; the conviction endpoint body may pass a model instead.
   */
  convictionModel?: string;
  /**
   * Max evidence points offered per conviction-synthesis run
   * (MEMORY_CONVICTION_BATCH_LIMIT, default 100, clamped 1–500).
   */
  convictionBatchLimit: number;
  /**
   * Max statements emitted per conviction-synthesis run
   * (MEMORY_CONVICTION_MAX_PER_CLUSTER, default 5, clamped 1–1000).
   */
  convictionMaxPerCluster: number;
  /**
   * Auto-trigger conviction synthesis after a partition's reflection sweep
   * (MEMORY_CONVICTION_AUTO, default false).
   */
  convictionAutoEnabled: boolean;
  /**
   * Chat model for the cluster-detection summarization pass
   * (MEMORY_CLUSTER_MODEL) — no default; the cluster endpoint body may
   * pass a model instead.
   */
  clusterModel?: string;
  /**
   * Minimum members for a structural cluster
   * (MEMORY_CLUSTER_MIN_MEMBERS, default 2, clamped 1–100).
   */
  clusterMinMembers: number;
  /**
   * Auto-trigger cluster detection after a lane's graph-mutating job
   * (MEMORY_CLUSTER_AUTO, default false).
   */
  clusterAutoEnabled: boolean;
  /**
   * Master switch for the Raptor layer: embed cluster synopses as searchable
   * points and recurse hierarchy levels above them (MEMORY_RAPTOR_ENABLED,
   * default true).
   */
  raptorEnabled: boolean;
  /**
   * Raptor recursion depth cap — highest synopsis level per scope
   * (MEMORY_RAPTOR_MAX_DEPTH, default 3, clamped 1–3).
   */
  raptorMaxDepth: number;
  /**
   * Recency weight for the episode probe (MEMORY_EPISODE_RECENCY_WEIGHT,
   * default 0.3, clamped 0–1) — how much recency may break topical ties.
   * Env baseline for the `episodeRecencyWeight` system variable.
   */
  episodeRecencyWeight: number;
  /**
   * Recency decay horizon in seconds (MEMORY_EPISODE_RECENCY_SCALE_SECONDS,
   * default 604800 = 1 week, clamped 60–31536000) — an episode this old
   * loses half its recency bonus. Env baseline for the
   * `episodeRecencyScaleSeconds` system variable.
   */
  episodeRecencyScaleSeconds: number;
  /**
   * Recency decay midpoint (MEMORY_EPISODE_RECENCY_MIDPOINT, default 0.5,
   * clamped 0.01–0.99). Env baseline for the `episodeRecencyMidpoint`
   * system variable.
   */
  episodeRecencyMidpoint: number;
  /**
   * Max episode records injected per turn (MEMORY_EPISODE_PROBE_LIMIT,
   * default 3, clamped 1–10). Env baseline for the `episodeProbeLimit`
   * system variable; surfaced to the harness via the cognition snapshot.
   */
  episodeProbeLimit: number;
  /**
   * Minimum cosine score for the episode probe's recency prefetch
   * (MEMORY_EPISODE_SCORE_THRESHOLD, default 0.1, clamped 0–1) — the noise
   * floor applied BEFORE the recency formula runs. Env baseline for the
   * `episodeScoreThreshold` system variable; far lower than the fact-lane
   * `scoreThreshold` because the episode lane answers meta-questions whose
   * topical similarity is inherently weak.
   */
  episodeScoreThreshold: number;
  /**
   * Share of the model's context window (numCtx × 4 chars/token) reserved for
   * the profile-job payload (MEMORY_PROFILE_PAYLOAD_RATIO, default 0.5;
   * 0 = uncapped). The job already receives numCtx from the harness.
   */
  profilePayloadRatio: number;
  /**
   * Absolute fallback for the profile-job payload cap when numCtx is absent
   * (MEMORY_PROFILE_PAYLOAD_CHARS, default 0 = uncapped).
   */
  profilePayloadChars: number;
  /**
   * Share of the model's context window reserved for the extract-step source
   * text (MEMORY_VECTORIZE_TEXT_RATIO, default 0.5; 0 = uncapped).
   */
  vectorizeTextRatio: number;
  /**
   * Absolute fallback for the extract-step source text cap when numCtx is
   * absent (MEMORY_VECTORIZE_TEXT_CHARS, default 0 = uncapped).
   */
  vectorizeTextChars: number;
  /**
   * Max semantic neighbors per dot in the constellation link graph
   * (MEMORY_LINK_NEIGHBORS, default 3, clamped 1–10).
   */
  linkNeighbors: number;
  /**
   * Minimum cosine score for a constellation link edge
   * (MEMORY_LINK_SCORE_THRESHOLD, default 0.5, clamped 0–1) — tighter than
   * the retrieval thresholds because links should only connect closely
   * related dots.
   */
  linkScoreThreshold: number;
  /**
   * Minimum cosine score for a TOPICAL (suggested) constellation link edge
   * (MEMORY_LINK_TOPICAL_THRESHOLD, default 0.6, clamped 0–1) — below the
   * semantic threshold, above the nomic anisotropy noise floor (0.51–0.55).
   * Topical edges are suggestions written by the relink job, never enforced:
   * recall ignores them and the dashboard may render them faintly.
   */
  linkTopicalThreshold: number;
  /**
   * Max points a lazy link-graph backfill will process in one pass
   * (MEMORY_LINK_BACKFILL_MAX_POINTS, default 5000, clamped 100–50000) —
   * bounds the one-time cold-start cost when a scope has points but no
   * precomputed edges yet.
   */
  linkBackfillMaxPoints: number;
  /**
   * Max edges returned per link-graph read (MEMORY_LINK_READ_MAX, default
   * 50000) — an infra bound on the dashboard payload, ordered by score desc.
   */
  linkReadMax: number;
}
