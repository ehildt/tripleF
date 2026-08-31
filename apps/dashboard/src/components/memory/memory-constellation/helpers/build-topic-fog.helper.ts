import type {
  ConstellationPosition,
  ConstellationTopic,
  TopicFog,
} from '../MemoryConstellation.types';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/** Extra padding around a topic's extent so the fog bleeds past members. */
const FOG_PADDING = 60;

/**
 * One fog field per topic, centered on the topic's main dot (the category
 * dot for a collapsed topic, else the first member) and sized to cover the
 * furthest relaxed member — so the dimension follows the dots.
 */
export function buildTopicFog(
  topics: readonly ConstellationTopic[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  collapsedKeys: ReadonlySet<string>,
): TopicFog[] {
  const fog: TopicFog[] = [];
  for (const topic of topics) {
    const center = collapsedKeys.has(topic.key)
      ? computeRelaxedCentroid(topic, relaxedPositions)
      : relaxedPositions.get(topic.memberIds[0]);
    if (!center) continue;
    let radius = 0;
    for (const memberId of topic.memberIds) {
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
      key: topic.key,
      center,
      radius: radius + FOG_PADDING,
      color: topic.color,
    });
  }
  return fog;
}
