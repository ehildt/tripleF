export interface MemoryAutoTriggersConfigProps {
  /** Whether partition reflection runs after its upstream job completes. */
  partitionReflectAutoEnabled?: boolean;
  /** Whether cognition reflection runs after its upstream job completes. */
  cognitionReflectAutoEnabled?: boolean;
  /** Whether encyclopedia reflection runs after its upstream job completes. */
  encyclopediaReflectAutoEnabled?: boolean;
  /** Whether conviction synthesis runs after its upstream job completes. */
  convictionAutoEnabled?: boolean;
  /** Whether clustering runs after its upstream job completes. */
  clusterAutoEnabled?: boolean;
  /** Persists the partition-reflection automatic trigger. */
  onSavePartitionReflectAutoEnabled: (value: boolean) => void;
  /** Persists the cognition-reflection automatic trigger. */
  onSaveCognitionReflectAutoEnabled: (value: boolean) => void;
  /** Persists the encyclopedia-reflection automatic trigger. */
  onSaveEncyclopediaReflectAutoEnabled: (value: boolean) => void;
  /** Persists the conviction-synthesis automatic trigger. */
  onSaveConvictionAutoEnabled: (value: boolean) => void;
  /** Persists the clustering automatic trigger. */
  onSaveClusterAutoEnabled: (value: boolean) => void;
}
