import type {
  ConstellationPosition,
  ConstellationTopic,
} from '../MemoryConstellation.types';

/**
 * Average of a topic's relaxed member positions — where a collapsed
 * topic's synthetic category dot sits.
 */
export function computeRelaxedCentroid(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition | undefined {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const memberId of topic.memberIds) {
    const pos = relaxedPositions.get(memberId);
    if (!pos) continue;
    x += pos.x;
    y += pos.y;
    z += pos.z;
    count += 1;
  }
  if (count === 0) return undefined;
  return { x: x / count, y: y / count, z: z / count };
}
