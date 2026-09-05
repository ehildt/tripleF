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
  /** Auto-trigger reflection after a partition's consolidation sweep. */
  partitionReflectAutoEnabled?: boolean | null;
  /** Auto-trigger reflection after a cognition profile job. */
  cognitionReflectAutoEnabled?: boolean | null;
  /** Auto-trigger reflection after the encyclopedia classification job. */
  encyclopediaReflectAutoEnabled?: boolean | null;
  /** Chat model for the reflection pass's friction verdicts. */
  reflectModel?: string | null;
  /** Max unreflected points screened per reflection run (1–500). */
  reflectBatchLimit?: number | null;
  /** Max near-neighbor candidates per point in the friction screen (1–100). */
  reflectMaxCandidates?: number | null;
  /** Chat model for the conviction-synthesis pass. */
  convictionModel?: string | null;
  /** Max evidence points offered per conviction-synthesis run (1–500). */
  convictionBatchLimit?: number | null;
  /** Max convictions written per cluster per conviction-synthesis run (1–1000). */
  convictionMaxPerCluster?: number | null;
  /** Auto-trigger conviction synthesis after a partition's reflection sweep. */
  convictionAutoEnabled?: boolean | null;
  /** Chat model for the cluster-detection summarization pass. */
  clusterModel?: string | null;
  /** Minimum members for a structural cluster (1–100). */
  clusterMinMembers?: number | null;
  /** Master switch for the Raptor synopsis layer. */
  raptorEnabled?: boolean | null;
  /** Raptor recursion depth cap (1–3). */
  raptorMaxDepth?: number | null;
  /** Auto-trigger cluster detection after a lane's graph-mutating job. */
  clusterAutoEnabled?: boolean | null;
  /** Chat model for the partition consolidation sweep. */
  consolidateModel?: string | null;
  /** Chat model for the encyclopedia classification job. */
  classifyModel?: string | null;
  /** Master switch for the gap-filling research job. */
  researchEnabled?: boolean | null;
  /** Search toggle for the research job's follow-up deep-dives. */
  researchSearchEnabled?: boolean | null;
  /** Search provider the research job uses ('serper' | 'bright-data'). */
  researchProvider?: string | null;
  /** Chat model for the research job's triage verdicts. */
  researchModel?: string | null;
  /** Max gaps triaged per research run (1–50). */
  researchGapLimit?: number | null;
  /** Max deep-dive depth per research chain (1–3). */
  researchMaxDepth?: number | null;
  /** Max pages fetched per research run (1–20). */
  researchFetchBudget?: number | null;
  /** Max contested-memory frictions screened per research run (1–20). */
  researchFrictionLimit?: number | null;
}
