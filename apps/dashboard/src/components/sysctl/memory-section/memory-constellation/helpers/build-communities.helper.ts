import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationNode,
} from '../MemoryConstellation.types';

/** Categorical palette for community hubs (stable by community order). */
const COMMUNITY_PALETTE = [
  '#f97316',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#6366f1',
];

/**
 * Group clusters into second-level communities by their members'
 * `communityKey` (a broad category like `games` or `pets`). Every category
 * gets a hub — even a lone cluster — so it can connect to the ZERO root.
 * Deterministic: first-seen community order.
 */
export function buildCommunities(
  nodes: readonly ConstellationNode[],
  clusters: readonly ConstellationCluster[],
): ConstellationCommunity[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const clusterKeysByCommunity = new Map<string, string[]>();
  const memberIdsByCommunity = new Map<string, string[]>();
  for (const cluster of clusters) {
    const communityKey = cluster.memberIds
      .map((id) => nodeById.get(id)?.communityKey)
      .find((key) => key != null && key.trim().length > 0);
    if (!communityKey) continue;
    const clusterKeys = clusterKeysByCommunity.get(communityKey) ?? [];
    clusterKeys.push(cluster.key);
    clusterKeysByCommunity.set(communityKey, clusterKeys);
    const memberIds = memberIdsByCommunity.get(communityKey) ?? [];
    memberIds.push(...cluster.memberIds);
    memberIdsByCommunity.set(communityKey, memberIds);
  }
  return [...clusterKeysByCommunity.entries()]
    .filter(([, clusterKeys]) => clusterKeys.length >= 1)
    .map(([key, clusterKeys], index) => ({
      key,
      label: key,
      color: COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length],
      memberClusterKeys: clusterKeys,
      memberIds: memberIdsByCommunity.get(key) ?? [],
    }));
}
