export interface MemoryScopePoint {
  /** Memory-point id. */
  id: string;
  /** Dense vector used for cluster detection and singleton absorption. */
  vector: number[];
  /** Stored record text used in cluster summaries. */
  text: string;
  /** Category grouping fallback and summary metadata. */
  category?: string;
  /** Community grouping metadata. */
  community?: string;
  /** Subject grouping metadata. */
  subject?: string;
  /** Tags attached to the memory point. */
  tags: string[];
}
