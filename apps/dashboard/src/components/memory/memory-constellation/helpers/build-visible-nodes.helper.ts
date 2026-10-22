import type {
  ConstellationFriction,
  ConstellationMainNodeSummary,
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { appendMemberNodes } from './append-member-nodes.helper';
import { appendTopicNode } from './append-topic-node.helper';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/**
 * Collapse collapsed topics into their main dot and resolve every other
 * topic's members to their relaxed positions. When the space feeds
 * server-written main-node summaries (`mainNodeByKey` defined), every
 * multi-member topic keeps its synthetic main dot visible while expanded
 * too — the dot between the hub tier and the leafs carries the summary of
 * the attached leafs (fallback: the member rollup). Legacy spaces (no main
 * nodes) keep the first member as the expanded main dot. The member lookup
 * and frictions feed the main dots' leaf rollup (hub tooltip meta).
 */
export function buildVisibleNodes(
  topics: readonly ConstellationTopic[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: Map<string, ConstellationNode>,
  collapsedKeys: ReadonlySet<string>,
  frictions: readonly ConstellationFriction[] = [],
  mainNodeByKey?: ReadonlyMap<string, ConstellationMainNodeSummary>,
): VisibleAccumulator {
  const acc: VisibleAccumulator = {
    visibleNodes: [],
    positions: new Map(),
    nodeIndex: new Map(),
  };
  for (const topic of topics) {
    // A single-member topic never gets a main dot — there is nothing to
    // fold, so its member renders directly.
    const multiMember = topic.memberIds.length > 1;
    if (!multiMember) {
      appendMemberNodes(topic, relaxedPositions, nodeById, acc);
      continue;
    }
    const collapsed = collapsedKeys.has(topic.key);
    if (collapsed || mainNodeByKey !== undefined) {
      appendTopicNode(
        topic,
        relaxedPositions,
        acc,
        nodeById,
        frictions,
        mainNodeByKey,
      );
    }
    if (collapsed) continue;
    appendNodeTierDots(topic, relaxedPositions, nodeById, acc);
    appendMemberNodes(
      topic,
      relaxedPositions,
      nodeById,
      acc,
      mainNodeByKey !== undefined
        ? computeRelaxedCentroid(topic, relaxedPositions)
        : undefined,
    );
  }
  return acc;
}

/** Average of one member-subset's relaxed positions. */
function centroidOf(
  memberIds: readonly string[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition | undefined {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const memberId of memberIds) {
    const pos = relaxedPositions.get(memberId);
    if (!pos) continue;
    x += pos.x;
    y += pos.y;
    z += pos.z;
    count += 1;
  }
  if (count === 0) return undefined;
  return { x: x / count, y: y / count, z: z / count };
}

/**
 * Append the topic's node-tier dots: one synthetic aspect dot per distinct
 * `node` label among the blob's members, at the group's relaxed centroid. A
 * blob whose members all share one aspect (or carry none) renders none —
 * the dot would only duplicate the hub's meaning.
 */
function appendNodeTierDots(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: Map<string, ConstellationNode>,
  acc: VisibleAccumulator,
): void {
  const byAspect = new Map<string, string[]>();
  for (const memberId of topic.memberIds) {
    const aspect = nodeById.get(memberId)?.node;
    if (!aspect) continue;
    byAspect.set(aspect, [...(byAspect.get(aspect) ?? []), memberId]);
  }
  if (byAspect.size < 2) return;
  for (const [aspect, memberIds] of byAspect) {
    const position = centroidOf(memberIds, relaxedPositions);
    if (!position) continue;
    const dot: ConstellationNode = {
      id: `node:${topic.key}:${aspect}`,
      label: aspect,
      topicKey: topic.key,
      text: `${memberIds.length} records`,
      summary: `${memberIds.length} records`,
      keys: [topic.key],
      isNodeTier: true,
      memberCount: memberIds.length,
    };
    acc.nodeIndex.set(dot.id, acc.visibleNodes.length);
    acc.visibleNodes.push(dot);
    acc.positions.set(dot.id, position);
  }
}
