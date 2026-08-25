import type { OrbitCenter, RelaxedLayout } from '../MemoryConstellation.types';

/** Phase step between leaves so they don't all align on the same radius. */
const PHASE_STEP = 0.7;

/**
 * Map every non-hub member to its cluster hub position + a phase offset —
 * the per-frame orbit transform's inputs. Hubs, category dots, community
 * hubs, and the root are excluded (they stay still while leaves circle).
 */
export function buildOrbitCenters(
  relaxedLayout: RelaxedLayout,
): Map<string, OrbitCenter> {
  const orbitCenters = new Map<string, OrbitCenter>();
  for (const cluster of relaxedLayout.clusters) {
    const hubId = cluster.memberIds[0];
    const center = relaxedLayout.positions.get(hubId);
    if (!center) continue;
    for (let i = 1; i < cluster.memberIds.length; i++) {
      orbitCenters.set(cluster.memberIds[i], {
        center,
        phase: i * PHASE_STEP,
      });
    }
  }
  return orbitCenters;
}
