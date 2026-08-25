import type {
  ConstellationCluster,
  ConstellationPosition,
} from '../MemoryConstellation.types';

/**
 * Average of a cluster's relaxed member positions — where a collapsed
 * cluster's synthetic category dot sits.
 */
export function computeRelaxedCentroid(
  cluster: ConstellationCluster,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition | undefined {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const memberId of cluster.memberIds) {
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
