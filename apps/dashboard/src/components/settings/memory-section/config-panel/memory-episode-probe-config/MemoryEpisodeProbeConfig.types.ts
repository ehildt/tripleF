export interface MemoryEpisodeProbeConfigProps {
  /** Relative weight of recency when ranking episode memories. */
  episodeRecencyWeight?: number;
  /** Time scale used by the episode recency-decay calculation. */
  episodeRecencyScaleSeconds?: number;
  /** Midpoint of the episode recency-decay calculation. */
  episodeRecencyMidpoint?: number;
  /** Maximum number of episode memories injected into a turn. */
  episodeProbeLimit?: number;
  /** Minimum relevance score required for an episode memory. */
  episodeScoreThreshold?: number;
  /** Persists a new recency weight. */
  onSaveEpisodeRecencyWeight: (value: number) => void;
  /** Persists a new recency time scale in seconds. */
  onSaveEpisodeRecencyScaleSeconds: (value: number) => void;
  /** Persists a new recency midpoint. */
  onSaveEpisodeRecencyMidpoint: (value: number) => void;
  /** Persists a new episode probe limit. */
  onSaveEpisodeProbeLimit: (value: number) => void;
  /** Persists a new episode relevance-score threshold. */
  onSaveEpisodeScoreThreshold: (value: number) => void;
}
