import type { ConstellationCluster } from '../MemoryConstellation.types';

/** Categorical palette for cluster hubs (stable by cluster order). */
const CLUSTER_PALETTE = [
  '#f97316',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#6366f1',
];

/** Build one cluster hub from a key/topic-keys pair. */
export function mapClusterEntry(
  [key, topicKeys]: [string, string[]],
  index: number,
  memberIdsByCluster: Map<string, string[]>,
): ConstellationCluster {
  return {
    key,
    label: key,
    color: CLUSTER_PALETTE[index % CLUSTER_PALETTE.length],
    memberTopicKeys: topicKeys,
    memberIds: memberIdsByCluster.get(key) ?? [],
  };
}
