import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
} from '../MemoryConstellation.types';
import { mapClusterToRootEdge } from './map-cluster-to-root-edge.helper';
import { mapCommunityToRootEdge } from './map-community-to-root-edge.helper';

/**
 * Root edges: the top tier of the hierarchy connects to the ZERO root dot
 * with a dashed gray line. When the space has categories (communities), each
 * category hub connects to the root (ZERO ← category ← sub-category). When
 * there are no categories, each cluster's main dot connects directly to the
 * root (ZERO ← main dot ← leaf).
 */
export function buildRootEdges(
  clusters: readonly ConstellationCluster[],
  communities: readonly ConstellationCommunity[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  if (communities.length > 0) {
    return communities.map(mapCommunityToRootEdge);
  }
  return clusters.map((cluster) =>
    mapClusterToRootEdge(cluster, collapsedKeys),
  );
}
