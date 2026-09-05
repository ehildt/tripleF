import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { communityNodeId } from './build-community-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/** Neutral gray for the ZERO root dot. */
const ROOT_NODE_COLOR = '#94a3b8';

/**
 * Cluster color for every member id, the synthetic topic dots, the
 * community hubs (parent cluster color), the cluster hub ids, and the ZERO
 * root id.
 */
export function buildNodeColor(
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[] = [],
  communities: readonly ConstellationCommunity[] = [],
): Map<string, string> {
  const nodeColor = new Map<string, string>();
  for (const topic of topics) {
    for (const id of topic.memberIds) nodeColor.set(id, topic.color);
    nodeColor.set(`topic:${topic.key}`, topic.color);
  }
  for (const community of communities) {
    nodeColor.set(communityNodeId(community.key), community.color);
  }
  for (const cluster of clusters) {
    nodeColor.set(clusterNodeId(cluster.key), cluster.color);
  }
  nodeColor.set(ROOT_NODE_ID, ROOT_NODE_COLOR);
  return nodeColor;
}
