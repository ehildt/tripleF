import type {
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
} from '../MemoryConstellation.types';

/** A leaf farther than this from its main dot folds back into the topic. */
const COLLAPSE_DISTANCE = 80;

/** Resolve the members that survive lookup, position, and stray-leaf filtering. */
export function resolveVisibleMemberIds(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: ReadonlyMap<string, ConstellationNode>,
  mainDotPosition?: ConstellationPosition,
): string[] {
  const hubPos = mainDotPosition ?? relaxedPositions.get(topic.memberIds[0]);
  return topic.memberIds.filter((memberId) => {
    const node = nodeById.get(memberId);
    const position = relaxedPositions.get(memberId);
    if (!node || !position) return false;
    const isMainDotMember = !mainDotPosition && memberId === topic.memberIds[0];
    if (isMainDotMember || !hubPos) return true;
    const distance = Math.sqrt(
      (position.x - hubPos.x) ** 2 +
        (position.y - hubPos.y) ** 2 +
        (position.z - hubPos.z) ** 2,
    );
    return distance <= COLLAPSE_DISTANCE;
  });
}
