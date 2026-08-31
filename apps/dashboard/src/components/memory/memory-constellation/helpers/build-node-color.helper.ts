import type {
  ConstellationCluster,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/** Neutral gray for the ZERO root dot. */
const ROOT_NODE_COLOR = '#94a3b8';

/**
 * Cluster color for every member id, the synthetic category-dot id, the
 * cluster hub ids, and the ZERO root id.
 */
export function buildNodeColor(
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[] = [],
): Map<string, string> {
  const nodeColor = new Map<string, string>();
  for (const topic of topics) {
    for (const id of topic.memberIds) nodeColor.set(id, topic.color);
    nodeColor.set(`topic:${topic.key}`, topic.color);
  }
  for (const cluster of clusters) {
    nodeColor.set(clusterNodeId(cluster.key), cluster.color);
  }
  nodeColor.set(ROOT_NODE_ID, ROOT_NODE_COLOR);
  return nodeColor;
}
