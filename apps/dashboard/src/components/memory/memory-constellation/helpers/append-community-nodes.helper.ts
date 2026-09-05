import type {
  ConstellationCommunity,
  ConstellationFriction,
  ConstellationNode,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildCommunityNode } from './build-community-node.helper';

/**
 * Append every community's synthetic hub dot at its relaxed position — like
 * cluster hubs, community hubs are always visible (they are few and carry
 * the sub-family overview), independent of member-topic collapse state.
 */
export function appendCommunityNodes(
  communities: readonly ConstellationCommunity[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
): void {
  for (const community of communities) {
    const node = buildCommunityNode(community, nodeById, frictions);
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    const pos = relaxedPositions.get(node.id);
    if (pos) acc.positions.set(node.id, pos);
  }
}
