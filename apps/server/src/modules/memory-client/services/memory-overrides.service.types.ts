/**
 * Wire contract of the memory-app settings lane (`/api/v1/memory-overrides`).
 * The memory app owns the wire — subset mirror of the GET read view
 * (apps/memory: qdrant/services/memory-overrides.service.ts#getConfig).
 */

/**
 * The fields the server's harness probes consume. The app returns the full
 * effective settings block; extend this when a server consumer needs more.
 */
export interface MemoryOverridesConfig {
  /** Effective cognition limit (env baseline or the persisted override). */
  cognitionLimit: number;
  /** The env-configured baseline cognition limit. */
  baseline: number;
  /** True when a persisted override is layered over the env baseline. */
  overridden: boolean;
  /** Blend weight of the episode recency boost in ranking. */
  episodeRecencyWeight: number;
  /** Recency decay scale in seconds. */
  episodeRecencyScaleSeconds: number;
  /** Recency decay midpoint (0.01–0.99). */
  episodeRecencyMidpoint: number;
  /** Max episode records injected per turn. */
  episodeProbeLimit: number;
  /** Minimum cosine similarity for an episode hit to count. */
  episodeScoreThreshold: number;
}
