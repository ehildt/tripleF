import type { MemoryLane } from '../../constants/memory-lane.constant.js';
import type { MemoryClusterRecord } from '../memory-cluster.repository.types.js';

/** One raw cluster row read back from Postgres (lane as the stored string). */
interface MemoryClusterRawRow {
  /** Cluster id. */
  id: string;
  /** Stored memory/lane value — cast to the lane union. */
  lane: string;
  /** Owning Qdrant collection. */
  collection: string;
  /** Space scope key the cluster lives under. */
  scopeKey: string;
  /** Content fingerprint driving idempotent sweeps. */
  fingerprint: string;
  /** Stored cluster label. */
  title: string;
  /** Stored cluster summary. */
  summary: string;
  /** Count of member points. */
  memberCount: number;
  /** Member point ids. */
  memberIds: string[];
  /** Hierarchy level of the cluster (0 = leaf over points). */
  level: number;
  /** Parent cluster id for upper levels (null at leaves). */
  parentId: string | null;
}

/** Map a Postgres cluster row to the repository record (null parent → undefined). */
export function mapClusterRowToRecord(
  row: MemoryClusterRawRow,
): MemoryClusterRecord {
  return {
    id: row.id,
    lane: row.lane as MemoryLane,
    collection: row.collection,
    scopeKey: row.scopeKey,
    fingerprint: row.fingerprint,
    title: row.title,
    summary: row.summary,
    memberCount: row.memberCount,
    memberIds: row.memberIds,
    level: row.level,
    parentId: row.parentId ?? undefined,
  };
}
