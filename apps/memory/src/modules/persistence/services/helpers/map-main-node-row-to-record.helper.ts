import type { MemoryLane } from '../../constants/memory-lane.constant.js';
import type { MemoryMainNodeRecord } from '../memory-main-node.repository.types.js';

/** One raw main-node row read back from Postgres (lane as the stored string). */
interface MemoryMainNodeRawRow {
  /** Main node id. */
  id: string;
  /** Stored memory/lane value — cast to the lane union. */
  lane: string;
  /** Owning Qdrant collection. */
  collection: string;
  /** Space scope key the main node lives under. */
  scopeKey: string;
  /** The topic-blob key this main node represents. */
  groupKey: string;
  /** Content fingerprint driving idempotent sweeps. */
  fingerprint: string;
  /** Stored label. */
  title: string;
  /** Stored summary. */
  summary: string;
  /** Count of member points. */
  memberCount: number;
  /** Member point ids. */
  memberIds: string[];
}

/** Map a Postgres main-node row to the repository record. */
export function mapMainNodeRowToRecord(
  row: MemoryMainNodeRawRow,
): MemoryMainNodeRecord {
  return {
    id: row.id,
    lane: row.lane as MemoryLane,
    collection: row.collection,
    scopeKey: row.scopeKey,
    groupKey: row.groupKey,
    fingerprint: row.fingerprint,
    title: row.title,
    summary: row.summary,
    memberCount: row.memberCount,
    memberIds: row.memberIds,
  };
}
