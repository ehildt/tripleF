import type { ConstellationTopic } from '../MemoryConstellation.types';

/**
 * The main dot id for a topic: the synthetic title-tier dot (`topic:<key>`)
 * whenever the blob has one — every topic under the main-node regime, and
 * collapsed multi-member legacy topics — or the single/first member otherwise.
 */
export function hubIdFor(
  topic: ConstellationTopic,
  collapsedKeys: ReadonlySet<string>,
  mainNodesEnabled = false,
): string {
  const hasMainDot =
    mainNodesEnabled ||
    (topic.memberIds.length > 1 && collapsedKeys.has(topic.key));
  return hasMainDot ? `topic:${topic.key}` : topic.memberIds[0];
}
