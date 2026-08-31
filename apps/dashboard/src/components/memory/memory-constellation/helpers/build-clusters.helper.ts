import type {
  ConstellationCluster,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { mapClusterEntry } from './map-cluster-entry.helper';

/**
 * Group topics into second-level clusters by their members'
 * `clusterKey` (a broad category like `games` or `pets`). Every category
 * gets a hub — even a lone topic — so it can connect to the ZERO root.
 * Deterministic: first-seen cluster order.
 */
export function buildClusters(
  nodes: readonly ConstellationNode[],
  topics: readonly ConstellationTopic[],
): ConstellationCluster[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const topicKeysByCluster = new Map<string, string[]>();
  const memberIdsByCluster = new Map<string, string[]>();
  for (const topic of topics) {
    const clusterKey = topic.memberIds
      .map((id) => nodeById.get(id)?.clusterKey)
      .find((key) => key != null && key.trim().length > 0);
    if (!clusterKey) continue;
    const topicKeys = topicKeysByCluster.get(clusterKey) ?? [];
    topicKeys.push(topic.key);
    topicKeysByCluster.set(clusterKey, topicKeys);
    const memberIds = memberIdsByCluster.get(clusterKey) ?? [];
    memberIds.push(...topic.memberIds);
    memberIdsByCluster.set(clusterKey, memberIds);
  }
  return [...topicKeysByCluster.entries()]
    .filter(([, topicKeys]) => topicKeys.length >= 1)
    .map((entry, index) => mapClusterEntry(entry, index, memberIdsByCluster));
}
