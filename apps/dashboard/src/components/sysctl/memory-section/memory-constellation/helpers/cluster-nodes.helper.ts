import type {
  ConstellationCluster,
  ConstellationNode,
} from '../MemoryConstellation.types';

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

/**
 * Group nodes by their `clusterKey` into cluster blobs, assigning each a
 * stable palette color. Cluster order follows first-seen key order, so the
 * layout is deterministic for a given node list.
 */
export function clusterNodes(
  nodes: readonly ConstellationNode[],
): ConstellationCluster[] {
  const byKey = new Map<string, string[]>();
  for (const node of nodes) {
    const members = byKey.get(node.clusterKey) ?? [];
    members.push(node.id);
    byKey.set(node.clusterKey, members);
  }
  return [...byKey.entries()].map(([key, memberIds], index) => ({
    key,
    label: key,
    color: CLUSTER_PALETTE[index % CLUSTER_PALETTE.length],
    memberIds,
  }));
}
