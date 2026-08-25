import type { RelaxedLayout } from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/**
 * Minimum overview radius (world units) so a sparse or empty constellation
 * never fit-zooms the camera in on a lone dot. A single cluster spans ~40
 * units (leaf → hub) and a community hub sits ~140 out, so 100 keeps a
 * couple of dots at a comfortable, zoomed-out scale.
 */
export const MIN_OVERVIEW_RADIUS = 100;

/**
 * Furthest cluster centroid / community hub distance from the origin — the
 * "all clusters shown" overview radius. Independent of collapse state, so the
 * zoom-out floor stays stable while clusters expand and collapse. Floored at
 * `MIN_OVERVIEW_RADIUS` so empty/sparse scenes don't zoom into a single dot.
 */
export function computeOverviewRadius(relaxedLayout: RelaxedLayout): number {
  let radius = MIN_OVERVIEW_RADIUS;
  for (const cluster of relaxedLayout.clusters) {
    const centroid = computeRelaxedCentroid(cluster, relaxedLayout.positions);
    if (!centroid) continue;
    const d = Math.sqrt(
      centroid.x * centroid.x +
        centroid.y * centroid.y +
        centroid.z * centroid.z,
    );
    if (d > radius) radius = d;
  }
  for (const community of relaxedLayout.communities) {
    const pos = relaxedLayout.positions.get(communityNodeId(community.key));
    if (!pos) continue;
    const d = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    if (d > radius) radius = d;
  }
  return radius;
}
