import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
} from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { hubIdFor } from './hub-id-for.helper';

/**
 * Community edges: each member cluster's main dot connects to its community
 * hub (the category dot when the cluster is collapsed). Same-community
 * clusters therefore relate through their shared category instead of a
 * direct hub-to-hub line.
 */
export function buildCommunityEdges(
  clusters: readonly ConstellationCluster[],
  communities: readonly ConstellationCommunity[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  const clusterByKey = new Map(
    clusters.map((cluster) => [cluster.key, cluster]),
  );
  const edges: ConstellationEdge[] = [];
  for (const community of communities) {
    for (const clusterKey of community.memberClusterKeys) {
      const cluster = clusterByKey.get(clusterKey);
      if (!cluster) continue;
      edges.push({
        source: hubIdFor(cluster, collapsedKeys),
        target: communityNodeId(community.key),
        kind: 'community',
      });
    }
  }
  return edges;
}
