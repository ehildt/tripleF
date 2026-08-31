import type {
  ConstellationCluster,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/**
 * Hub ids: the category dot of a collapsed topic, else the first member —
 * plus every cluster hub id and the ZERO root id.
 */
export function buildHubIds(
  topics: readonly ConstellationTopic[],
  collapsedKeys: ReadonlySet<string>,
  clusters: readonly ConstellationCluster[] = [],
): Set<string> {
  const hubIds = new Set<string>();
  for (const topic of topics) {
    if (collapsedKeys.has(topic.key) && topic.memberIds.length > 1) {
      hubIds.add(`topic:${topic.key}`);
    } else if (topic.memberIds.length > 0) {
      hubIds.add(topic.memberIds[0]);
    }
  }
  for (const cluster of clusters) {
    hubIds.add(clusterNodeId(cluster.key));
  }
  hubIds.add(ROOT_NODE_ID);
  return hubIds;
}
