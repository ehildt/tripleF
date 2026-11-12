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
import { resolveVisibleMemberIds } from './resolve-visible-member-ids.helper';

/**
 * Collapse collapsed topics into their main dot and resolve every other
 * topic's members to their relaxed positions. When the space feeds
 * server-written main-node summaries (`mainNodeByKey` defined), every
 * populated topic keeps its synthetic main dot visible while expanded too — the dot between the hub tier and the leafs carries the
 * summary of the attached leafs (fallback: the member rollup). Collapsed
 * topics keep their folded hub even though descendants are hidden. Legacy
 * spaces (no main nodes) keep the first member as the expanded main dot. The member lookup
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
    // Legacy spaces keep the single-leaf shortcut. Main-node spaces render
    // the complete populated hub → node → leaf chain even for one leaf.
    const multiMember = topic.memberIds.length > 1;
    if (!multiMember && mainNodeByKey === undefined) {
      appendMemberNodes(topic, relaxedPositions, nodeById, acc);
      continue;
    }
    const collapsed = collapsedKeys.has(topic.key);
    const mainDotPosition =
      mainNodeByKey !== undefined
        ? computeRelaxedCentroid(topic, relaxedPositions)
        : undefined;
    const visibleMemberIds = resolveVisibleMemberIds(
      topic,
      relaxedPositions,
      nodeById,
      mainDotPosition,
    );
    if (
      (collapsed || mainNodeByKey !== undefined) &&
      (collapsed || visibleMemberIds.length > 0)
    ) {
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
    if (visibleMemberIds.length === 0) continue;
    if (mainNodeByKey !== undefined) {
      appendNodeTierDots(
        topic,
        relaxedPositions,
        nodeById,
        acc,
        visibleMemberIds,
      );
    }
    appendMemberNodes(topic, relaxedPositions, nodeById, acc, mainDotPosition);
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

/** Minimum world distance between a hub and its node-tier child. */
const MIN_NODE_HUB_DISTANCE = 16;

/** Keep a single/symmetric aspect centroid from overlapping its hub exactly. */
function separateNodeFromHub(
  position: ConstellationPosition,
  hubPosition: ConstellationPosition | undefined,
): ConstellationPosition {
  if (!hubPosition) return position;
  const dx = position.x - hubPosition.x;
  const dy = position.y - hubPosition.y;
  const dz = position.z - hubPosition.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (distance >= MIN_NODE_HUB_DISTANCE) return position;
  if (distance === 0) {
    return {
      x: hubPosition.x + MIN_NODE_HUB_DISTANCE,
      y: hubPosition.y,
      z: hubPosition.z,
    };
  }
  const scale = MIN_NODE_HUB_DISTANCE / distance;
  return {
    x: hubPosition.x + dx * scale,
    y: hubPosition.y + dy * scale,
    z: hubPosition.z + dz * scale,
  };
}

/**
 * Append the topic's node-tier dots: one synthetic aspect dot per distinct
 * `node` label among the hub's visible members, at the group's relaxed
 * centroid. Empty aspects never render because their leaves were filtered
 * before this pass. A single aspect still gets its node tier.
 */
function appendNodeTierDots(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: ReadonlyMap<string, ConstellationNode>,
  acc: VisibleAccumulator,
  visibleMemberIds: readonly string[],
): void {
  const byAspect = new Map<string, string[]>();
  for (const memberId of visibleMemberIds) {
    const aspect = nodeById.get(memberId)?.node?.trim();
    if (!aspect) continue;
    byAspect.set(aspect, [...(byAspect.get(aspect) ?? []), memberId]);
  }
  if (byAspect.size === 0) return;
  const hubPosition = computeRelaxedCentroid(topic, relaxedPositions);
  for (const [aspect, memberIds] of byAspect) {
    const centroid = centroidOf(memberIds, relaxedPositions);
    if (!centroid) continue;
    const position = separateNodeFromHub(centroid, hubPosition);
    const dot: ConstellationNode = {
      id: `node:${topic.key}:${aspect}`,
      label: aspect,
      topicKey: topic.key,
      text: `${memberIds.length} records`,
      summary: `${memberIds.length} records`,
      keys: [topic.key],
      meta: [{ label: 'records', value: String(memberIds.length) }],
      isNodeTier: true,
      memberCount: memberIds.length,
    };
    acc.nodeIndex.set(dot.id, acc.visibleNodes.length);
    acc.visibleNodes.push(dot);
    acc.positions.set(dot.id, position);
  }
}
