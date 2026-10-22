/**
 * Boundary of the cluster-synopsis layer storage: the Raptor record shape
 * plus its write/read projections. Kept for producers and probe consumers.
 */

/** The two lanes the synopsis layer covers (mirrors the cluster lanes). */
export type SynopsisLane = 'partition' | 'encyclopedia';

/**
 * One cluster synopsis: the Raptor unit. A level-0 synopsis summarizes one
 * leaf cluster's points; a level-n synopsis summarizes level-(n-1) synopses.
 * Stored as its own Qdrant point in the lane's synopsis collection so a
 * cross-cutting query can vector-match the community summary directly.
 */
export interface SynopsisRecord {
  /** Deterministic point id: `synopsis|<clusterId>` — re-runs overwrite in place. */
  id: string;
  /** The cluster this synopsis summarizes (drill-down + cleanup key). */
  clusterId: string;
  /** Space key: partition key / 'global' (encyclopedia). */
  scopeKey: string;
  /** Hierarchy level of the cluster (0 = leaf cluster over points). */
  level: number;
  /** LLM-written short noun-phrase label. */
  title: string;
  /** LLM-written one/two-sentence community summary. */
  summary: string;
  /** Direct members of the summarized cluster (points at level 0, clusters above). */
  memberCount: number;
  /** Retrieval count — incremented every time the synopsis probe surfaces this synopsis (heat tracking). */
  heatAmount?: number;
  /** ISO timestamp of the last probe hit. */
  heatTimestamp?: string;
}

/** One synopsis point to write (record + vector). */
export interface SynopsisPoint extends SynopsisRecord {
  /** Embedded vector of the summary. */
  vector: number[];
}

/** A synopsis read back by the probe (payload + retrieval score). */
export interface SynopsisHit extends SynopsisRecord {
  /** Cosine similarity to the query. */
  score?: number;
}
