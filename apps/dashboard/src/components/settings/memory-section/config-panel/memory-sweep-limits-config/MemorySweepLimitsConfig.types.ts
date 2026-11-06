export interface MemorySweepLimitsConfigProps {
  /** Maximum records processed by one reflection batch. */
  reflectBatchLimit?: number;
  /** Maximum candidates considered by a reflection pass. */
  reflectMaxCandidates?: number;
  /** Maximum records processed by one conviction-synthesis batch. */
  convictionBatchLimit?: number;
  /** Maximum convictions synthesized for each cluster. */
  convictionMaxPerCluster?: number;
  /** Minimum members required before a cluster is processed. */
  clusterMinMembers?: number;
  /** Whether hierarchical Raptor summarization is enabled. */
  raptorEnabled?: boolean;
  /** Whether memory heat tracking is enabled. */
  heatTrackingEnabled?: boolean;
  /** Maximum depth of the Raptor summary hierarchy. */
  raptorMaxDepth?: number;
  /** Persists a new reflection batch limit. */
  onSaveReflectBatchLimit: (value: number) => void;
  /** Persists a new reflection candidate cap. */
  onSaveReflectMaxCandidates: (value: number) => void;
  /** Persists a new conviction-synthesis batch limit. */
  onSaveConvictionBatchLimit: (value: number) => void;
  /** Persists a new per-cluster conviction cap. */
  onSaveConvictionMaxPerCluster: (value: number) => void;
  /** Persists a new minimum cluster size. */
  onSaveClusterMinMembers: (value: number) => void;
  /** Persists the Raptor enablement flag. */
  onSaveRaptorEnabled: (value: boolean) => void;
  /** Persists the heat-tracking enablement flag. */
  onSaveHeatTrackingEnabled: (value: boolean) => void;
  /** Persists a new Raptor hierarchy depth. */
  onSaveRaptorMaxDepth: (value: number) => void;
}
