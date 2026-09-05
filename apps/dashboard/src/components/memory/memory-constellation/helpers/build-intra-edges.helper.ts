import type {
  ConstellationEdge,
  ConstellationTopic,
} from '../MemoryConstellation.types';

/** Intra edges: each leaf connects to its main dot (skips collapsed topics). */
export function buildIntraEdges(
  topics: readonly ConstellationTopic[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];
  for (const topic of topics) {
    if (collapsedKeys.has(topic.key)) continue;
    const hub = topic.memberIds[0];
    for (let i = 1; i < topic.memberIds.length; i++) {
      edges.push({ source: hub, target: topic.memberIds[i], kind: 'intra' });
    }
  }
  return edges;
}
