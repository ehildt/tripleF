import type {
  ConstellationCluster,
  ConstellationCommunity,
} from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/** Neutral gray for the ZERO root dot. */
const ROOT_NODE_COLOR = '#94a3b8';

/**
 * Cluster color for every member id, the synthetic category-dot id, the
 * community hub ids, and the ZERO root id.
 */
export function buildNodeColor(
  clusters: readonly ConstellationCluster[],
  communities: readonly ConstellationCommunity[] = [],
): Map<string, string> {
  const nodeColor = new Map<string, string>();
  for (const cluster of clusters) {
    for (const id of cluster.memberIds) nodeColor.set(id, cluster.color);
    nodeColor.set(`cluster:${cluster.key}`, cluster.color);
  }
  for (const community of communities) {
    nodeColor.set(communityNodeId(community.key), community.color);
  }
  nodeColor.set(ROOT_NODE_ID, ROOT_NODE_COLOR);
  return nodeColor;
}
