import type {
  ConstellationCommunity,
  ConstellationFriction,
  ConstellationNode,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildCommunityNode } from './build-community-node.helper';

/**
 * Append each populated community's synthetic hub dot at its relaxed position.
 * Collapsed member hubs count as descendants; a community with no rendered
 * descendant is omitted rather than shown as an empty hub.
 */
export function appendCommunityNodes(
  communities: readonly ConstellationCommunity[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
  visibleNodeIds?: ReadonlySet<string>,
): void {
  for (const community of communities) {
    if (
      visibleNodeIds &&
      !community.memberTopicKeys.some((key) =>
        visibleNodeIds.has(`topic:${key}`),
      ) &&
      !community.memberIds.some((id) => visibleNodeIds.has(id))
    ) {
      continue;
    }
    const node = buildCommunityNode(community, nodeById, frictions);
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    const pos = relaxedPositions.get(node.id);
    if (pos) acc.positions.set(node.id, pos);
  }
}
