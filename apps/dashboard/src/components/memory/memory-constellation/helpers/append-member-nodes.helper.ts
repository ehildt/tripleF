import type {
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  VisibleAccumulator,
} from '../MemoryConstellation.types';

/**
 * A leaf further than this (world units) from its main dot is auto-collapsed
 * (hidden) — it reads as a stray dot, so it folds back into the topic.
 */
const COLLAPSE_DISTANCE = 80;

/** Euclidean distance between two world positions. */
function distance3d(a: ConstellationPosition, b: ConstellationPosition) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** Append an expanded/small topic's members at their relaxed positions. */
export function appendMemberNodes(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: Map<string, ConstellationNode>,
  acc: VisibleAccumulator,
): void {
  const hubId = topic.memberIds[0];
  const hubPos = relaxedPositions.get(hubId);
  for (const memberId of topic.memberIds) {
    const node = nodeById.get(memberId);
    if (!node) continue;
    const pos = relaxedPositions.get(memberId);
    if (!pos) continue;
    // Auto-collapse: a leaf that drifted too far from its main dot is hidden
    // (folded back into the topic) rather than shown as a stray dot.
    if (memberId !== hubId && hubPos) {
      if (distance3d(pos, hubPos) > COLLAPSE_DISTANCE) continue;
    }
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    acc.positions.set(node.id, pos);
  }
}
