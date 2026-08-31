import type {
  ConstellationCluster,
  ConstellationCommunity,
} from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/**
 * Hub ids: the category dot of a collapsed cluster, else the first member —
 * plus every community hub id and the ZERO root id.
 */
export function buildHubIds(
  clusters: readonly ConstellationCluster[],
  collapsedKeys: ReadonlySet<string>,
  communities: readonly ConstellationCommunity[] = [],
): Set<string> {
  const hubIds = new Set<string>();
  for (const cluster of clusters) {
    if (collapsedKeys.has(cluster.key) && cluster.memberIds.length > 1) {
      hubIds.add(`cluster:${cluster.key}`);
    } else if (cluster.memberIds.length > 0) {
      hubIds.add(cluster.memberIds[0]);
    }
  }
  for (const community of communities) {
    hubIds.add(communityNodeId(community.key));
  }
  hubIds.add(ROOT_NODE_ID);
  return hubIds;
}
