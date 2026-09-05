import type {
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { mapTopicEntry } from './map-topic-entry.helper';

/**
 * Group nodes by their `topicKey` into topic blobs, assigning each a
 * stable palette color. Cluster order follows first-seen key order, so the
 * layout is deterministic for a given node list.
 */
export function topicNodes(
  nodes: readonly ConstellationNode[],
): ConstellationTopic[] {
  const byKey = new Map<string, string[]>();
  for (const node of nodes) {
    const members = byKey.get(node.topicKey) ?? [];
    members.push(node.id);
    byKey.set(node.topicKey, members);
  }
  return [...byKey.entries()].map(mapTopicEntry);
}
