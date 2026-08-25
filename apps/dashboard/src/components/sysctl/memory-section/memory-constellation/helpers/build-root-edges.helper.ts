import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
} from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { hubIdFor } from './hub-id-for.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

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
    return communities.map((community) => ({
      source: communityNodeId(community.key),
      target: ROOT_NODE_ID,
      kind: 'root' as const,
    }));
  }
  return clusters.map((cluster) => ({
    source: hubIdFor(cluster, collapsedKeys),
    target: ROOT_NODE_ID,
    kind: 'root' as const,
  }));
}
