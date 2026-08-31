import type { RelaxedLayout } from '../MemoryConstellation.types';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/** Furthest member distance from a topic's centroid (the collapse radius). */
export function computeTopicCollapseRadius(
  relaxedLayout: RelaxedLayout,
  key: string,
): number {
  const topic = relaxedLayout.topics.find((c) => c.key === key);
  if (!topic) return 0;
  const centroid = computeRelaxedCentroid(topic, relaxedLayout.positions);
  if (!centroid) return 0;
  let radius = 0;
  for (const memberId of topic.memberIds) {
    const pos = relaxedLayout.positions.get(memberId);
    if (!pos) continue;
    const d = Math.sqrt(
      (pos.x - centroid.x) ** 2 +
        (pos.y - centroid.y) ** 2 +
        (pos.z - centroid.z) ** 2,
    );
    if (d > radius) radius = d;
  }
  return radius;
}
