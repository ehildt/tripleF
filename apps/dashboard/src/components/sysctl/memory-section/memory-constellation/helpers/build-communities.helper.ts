import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { mapCommunityEntry } from './map-community-entry.helper';

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
    .map((entry, index) =>
      mapCommunityEntry(entry, index, memberIdsByCommunity),
    );
}
