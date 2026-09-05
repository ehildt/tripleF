import type { ConstellationTopic } from '../MemoryConstellation.types';

/** The main dot id for a topic: category dot (collapsed multi-member) or
 *  first member. Single-member topics never collapse (there is nothing to
 *  expand), so they always resolve to their member. */
export function hubIdFor(
  topic: ConstellationTopic,
  collapsedKeys: ReadonlySet<string>,
): string {
  return collapsedKeys.has(topic.key) && topic.memberIds.length > 1
    ? `topic:${topic.key}`
    : topic.memberIds[0];
}
