export interface MemoryOverridesPatch {
  /**
   * Cognition profile character cap (serialized JSON size). Number sets the
   * override; null clears it (back to the env baseline). Clamped 500–32000.
   */
  cognitionLimit?: number | null;
  /** Recency weight for the episode probe (0–1). */
  episodeRecencyWeight?: number | null;
  /** Recency decay horizon in seconds (60–31536000). */
  episodeRecencyScaleSeconds?: number | null;
  /** Recency decay midpoint (0.01–0.99). */
  episodeRecencyMidpoint?: number | null;
  /** Max episode records injected per turn (1–10). */
  episodeProbeLimit?: number | null;
  /** Minimum cosine score for the episode probe's recency prefetch (0–1). */
  episodeScoreThreshold?: number | null;
  /** Max fact records the constellation loads per space (100–10000). */
  constellationNodeLimit?: number | null;
}
