import type { MemoryLane } from '../constants/memory-lane.constant.js';

/**
 * Boundary of the main-node registry: the title-tier topic blobs the
 * constellation rendering groups its leafs around.
 */

/** One main node read back for the dashboard. */
export interface MemoryMainNodeRecord {
  /** Main node id. */
  id: string;
  /** Constellation lane. */
  lane: MemoryLane;
  /** Qdrant collection the member points live in. */
  collection: string;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** The topic-blob key this main node represents (subject/tag/title/domain). */
  groupKey: string;
  /** Structural fingerprint of the member set (staleness checks). */
  fingerprint: string;
  /** The topic label. */
  title: string;
  /** LLM-written summary of the blob. */
  summary: string;
  /** Direct members of the blob. */
  memberCount: number;
  /** Point ids of the members. */
  memberIds: string[];
}

/** One main node row to write (the cluster job's replace-scope input). */
export interface MemoryMainNodeRow {
  /** Main node id. */
  id: string;
  /** Constellation lane. */
  lane: MemoryLane;
  /** Qdrant collection the member points live in. */
  collection: string;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** The topic-blob key this main node represents (subject/tag/title/domain). */
  groupKey: string;
  /** Structural fingerprint of the member set (staleness checks). */
  fingerprint: string;
  /** The topic label. */
  title: string;
  /** LLM-written summary of the blob. */
  summary: string;
  /** Direct members of the blob. */
  memberCount: number;
  /** Point ids of the members. */
  memberIds: string[];
}
