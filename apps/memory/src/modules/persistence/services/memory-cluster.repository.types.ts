import type { MemoryLane } from '../constants/memory-lane.constant.js';

/**
 * Boundary of the cluster registry: dashboard/retrieval reads and the
 * cluster job's replace-scope writes.
 */

/** One cluster read back for the dashboard / retrieval attach. */
export interface MemoryClusterRecord {
  /** Cluster id. */
  id: string;
  /** Constellation lane (partition / encyclopedia / cognition). */
  lane: MemoryLane;
  /** Qdrant collection the clustered points live in. */
  collection: string;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** Structural fingerprint of the member set (staleness checks). */
  fingerprint: string;
  /** LLM-written short noun-phrase label. */
  title: string;
  /** LLM-written community summary. */
  summary: string;
  /** Direct members of the cluster. */
  memberCount: number;
  /** Point ids (level 0) or child cluster ids (level 1+) of the members. */
  memberIds: string[];
  /** Hierarchy level: 0 = leaf cluster over points; 1+ = cluster of cluster synopses. */
  level: number;
  /** Parent cluster id at level+1 (null on the top level). */
  parentId?: string;
}

/** One cluster row to write (the job's replace-scope input). */
export interface MemoryClusterRow {
  /** Cluster id. */
  id: string;
  /** Constellation lane. */
  lane: MemoryLane;
  /** Qdrant collection the clustered points live in. */
  collection: string;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** Structural fingerprint of the member set (staleness checks). */
  fingerprint: string;
  /** LLM-written short noun-phrase label. */
  title: string;
  /** LLM-written community summary. */
  summary: string;
  /** Direct members of the cluster. */
  memberCount: number;
  /** Point ids (level 0) or child cluster ids (level 1+) of the members. */
  memberIds: string[];
  /** Hierarchy level (default 0 = leaf). */
  level: number;
  /** Parent cluster id at level+1 (null on the top level). */
  parentId?: string;
}
