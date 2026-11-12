import type { OrbitCenter, RelaxedLayout } from '../MemoryConstellation.types';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/** Phase step between leaves so they don't all align on the same radius. */
const PHASE_STEP = 0.7;

/**
 * Map every orbiting leaf to its topic's main-dot position + a phase
 * offset — the per-frame orbit transform's inputs. Under the main-node
 * regime every topic uses the synthetic title dot at its centroid, including
 * a single-leaf topic; otherwise the first member IS the main dot (it stays
 * still while the other leaves circle it). Hubs and synthetic dots are excluded.
 */
export function buildOrbitCenters(
  relaxedLayout: RelaxedLayout,
  mainNodesEnabled = false,
): Map<string, OrbitCenter> {
  const orbitCenters = new Map<string, OrbitCenter>();
  for (const topic of relaxedLayout.topics) {
    if (mainNodesEnabled) {
      const center = computeRelaxedCentroid(topic, relaxedLayout.positions);
      if (!center) continue;
      topic.memberIds.forEach((memberId, index) => {
        orbitCenters.set(memberId, { center, phase: index * PHASE_STEP });
      });
      continue;
    }
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
