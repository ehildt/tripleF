import type { ConstellationPosition } from '../MemoryConstellation.types';

/**
 * Calculate the mean of the defined positions. Missing positions are skipped;
 * an empty set falls back to the origin so synthetic hubs always have a seed.
 */
export function calcMeanPosition(
  positions: ReadonlyArray<ConstellationPosition | undefined>,
): ConstellationPosition {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const position of positions) {
    if (!position) continue;
    x += position.x;
    y += position.y;
    z += position.z;
    count += 1;
  }
  if (count === 0) return { x: 0, y: 0, z: 0 };
  return { x: x / count, y: y / count, z: z / count };
}
