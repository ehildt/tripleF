import type {
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { resolveVisibleMemberIds } from './resolve-visible-member-ids.helper';

/**
 * Append an expanded/small topic's members at their relaxed positions. The
 * stray-leaf distance is measured against the main dot: the blob centroid
 * when a synthetic main dot was passed, else the first member (the legacy
 * main dot, which always stays visible itself).
 */
export function appendMemberNodes(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: ReadonlyMap<string, ConstellationNode>,
  acc: VisibleAccumulator,
  mainDotPosition?: ConstellationPosition,
): void {
  const memberIds = resolveVisibleMemberIds(
    topic,
    relaxedPositions,
    nodeById,
    mainDotPosition,
  );
  for (const memberId of memberIds) {
    const node = nodeById.get(memberId);
    const pos = relaxedPositions.get(memberId);
    if (!node || !pos) continue;
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    acc.positions.set(node.id, pos);
  }
}
