import type {
  ConstellationCommunity,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildCommunityNode } from './build-community-node.helper';

/**
 * Append every community's synthetic hub dot at its relaxed position —
 * community hubs are always visible (they are few and carry the category
 * overview), independent of member-cluster collapse state.
 */
export function appendCommunityNodes(
  communities: readonly ConstellationCommunity[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
): void {
  for (const community of communities) {
    const node = buildCommunityNode(community);
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    const pos = relaxedPositions.get(node.id);
    if (pos) acc.positions.set(node.id, pos);
  }
}
