import type { ConstellationCommunity } from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/** Build a root edge from a community hub. */
export function mapCommunityToRootEdge(community: ConstellationCommunity) {
  return {
    source: communityNodeId(community.key),
    target: ROOT_NODE_ID,
    kind: 'root' as const,
  };
}
