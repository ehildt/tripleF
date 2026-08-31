import type { ConstellationCluster } from '../MemoryConstellation.types';

/** Categorical palette for cluster blobs (stable by cluster order). */
const CLUSTER_PALETTE = [
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#14b8a6',
];

/** Build one cluster blob from a key/member pair. */
export function mapClusterEntry(
  [key, memberIds]: [string, string[]],
  index: number,
): ConstellationCluster {
  return {
    key,
    label: key,
    color: CLUSTER_PALETTE[index % CLUSTER_PALETTE.length],
    memberIds,
  };
}
