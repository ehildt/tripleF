import type { OrbitCenter, RelaxedLayout } from '../MemoryConstellation.types';

/** Phase step between leaves so they don't all align on the same radius. */
const PHASE_STEP = 0.7;

/**
 * Map every non-hub member to its topic hub position + a phase offset —
 * the per-frame orbit transform's inputs. Hubs, category dots, cluster
 * hubs, and the root are excluded (they stay still while leaves circle).
 */
export function buildOrbitCenters(
  relaxedLayout: RelaxedLayout,
): Map<string, OrbitCenter> {
  const orbitCenters = new Map<string, OrbitCenter>();
  for (const topic of relaxedLayout.topics) {
    const hubId = topic.memberIds[0];
    const center = relaxedLayout.positions.get(hubId);
    if (!center) continue;
    for (let i = 1; i < topic.memberIds.length; i++) {
      orbitCenters.set(topic.memberIds[i], {
        center,
        phase: i * PHASE_STEP,
      });
    }
  }
  return orbitCenters;
}
