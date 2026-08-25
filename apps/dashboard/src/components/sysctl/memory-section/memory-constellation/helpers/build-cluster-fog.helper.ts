import type {
  ClusterFog,
  ConstellationCluster,
  ConstellationPosition,
} from '../MemoryConstellation.types';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/** Extra padding around a cluster's extent so the fog bleeds past members. */
const FOG_PADDING = 60;

/**
 * One fog field per cluster, centered on the cluster's main dot (the category
 * dot for a collapsed cluster, else the first member) and sized to cover the
 * furthest relaxed member — so the dimension follows the dots.
 */
export function buildClusterFog(
  clusters: readonly ConstellationCluster[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  collapsedKeys: ReadonlySet<string>,
): ClusterFog[] {
  const fog: ClusterFog[] = [];
  for (const cluster of clusters) {
    const center = collapsedKeys.has(cluster.key)
      ? computeRelaxedCentroid(cluster, relaxedPositions)
      : relaxedPositions.get(cluster.memberIds[0]);
    if (!center) continue;
    let radius = 0;
    for (const memberId of cluster.memberIds) {
      const pos = relaxedPositions.get(memberId);
      if (!pos) continue;
      const d = Math.sqrt(
        (pos.x - center.x) ** 2 +
          (pos.y - center.y) ** 2 +
          (pos.z - center.z) ** 2,
      );
      if (d > radius) radius = d;
    }
    fog.push({
      key: cluster.key,
      center,
      radius: radius + FOG_PADDING,
      color: cluster.color,
    });
  }
  return fog;
}
