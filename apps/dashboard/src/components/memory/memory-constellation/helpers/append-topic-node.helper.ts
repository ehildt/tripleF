import type {
  ConstellationFriction,
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildHubMeta } from './build-hub-meta.helper';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/**
 * Append a collapsed topic's synthetic category dot at its relaxed centroid.
 * When the member lookup is provided, the dot carries the leaf rollup
 * (records, sources, health, freshness) in its tooltip + metadata column.
 */
export function appendTopicNode(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
): void {
  const centroid = computeRelaxedCentroid(topic, relaxedPositions);
  const members = nodeById
    ? topic.memberIds
        .map((id) => nodeById.get(id))
        .filter((node): node is ConstellationNode => node !== undefined)
    : [];
  const rollup = nodeById ? buildHubMeta(members, frictions) : undefined;
  const summary = rollup?.summary ?? `${topic.memberIds.length} records`;
  const categoryNode: ConstellationNode = {
    id: `topic:${topic.key}`,
    label: topic.label,
    topicKey: topic.key,
    text: `${summary} — click to toggle`,
    summary,
    keys: [topic.key],
    meta: rollup?.meta,
    isTopic: true,
    memberCount: topic.memberIds.length,
  };
  acc.nodeIndex.set(categoryNode.id, acc.visibleNodes.length);
  acc.visibleNodes.push(categoryNode);
  if (centroid) acc.positions.set(categoryNode.id, centroid);
}
