import type {
  ConstellationFriction,
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { appendMemberNodes } from './append-member-nodes.helper';
import { appendTopicNode } from './append-topic-node.helper';

/**
 * Collapse collapsed topics into a single category dot and resolve every
 * other topic's members to their relaxed positions. The member lookup and
 * frictions feed the collapsed dots' leaf rollup (hub tooltip meta).
 */
export function buildVisibleNodes(
  topics: readonly ConstellationTopic[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: Map<string, ConstellationNode>,
  collapsedKeys: ReadonlySet<string>,
  frictions: readonly ConstellationFriction[] = [],
): VisibleAccumulator {
  const acc: VisibleAccumulator = {
    visibleNodes: [],
    positions: new Map(),
    nodeIndex: new Map(),
  };
  for (const topic of topics) {
    // A single-member topic never collapses to a "Click to expand" dot —
    // there is nothing to expand, so its member renders directly.
    if (collapsedKeys.has(topic.key) && topic.memberIds.length > 1) {
      appendTopicNode(topic, relaxedPositions, acc, nodeById, frictions);
    } else {
      appendMemberNodes(topic, relaxedPositions, nodeById, acc);
    }
  }
  return acc;
}
