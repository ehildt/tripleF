import type {
  ConstellationFriction,
  ConstellationMainNodeSummary,
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildHubMeta } from './build-hub-meta.helper';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';
import { truncateText } from './truncate-text.helper';

/**
 * Append a topic's synthetic main dot at its relaxed centroid — the
 * title-tier node between the hub tier and the leafs. When a server main
 * node exists for the blob, the dot carries the LLM-written summary of its
 * attached leafs; otherwise it falls back to the deterministic leaf rollup
 * (records, sources, health, freshness — needs the member lookup).
 */
export function appendTopicNode(
  topic: ConstellationTopic,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
  mainNodeByKey?: ReadonlyMap<string, ConstellationMainNodeSummary>,
): void {
  const centroid = computeRelaxedCentroid(topic, relaxedPositions);
  const members = nodeById
    ? topic.memberIds
        .map((id) => nodeById.get(id))
        .filter((node): node is ConstellationNode => node !== undefined)
    : [];
  const rollup = nodeById ? buildHubMeta(members, frictions) : undefined;
  const semantic = mainNodeByKey?.get(topic.key)?.summary.trim();
  const rollupLine = rollup?.summary ?? `${topic.memberIds.length} records`;
  const content = semantic || rollupLine;
  const categoryNode: ConstellationNode = {
    id: `topic:${topic.key}`,
    label: topic.label,
    topicKey: topic.key,
    text: content,
    detailsText: semantic || undefined,
    summary: semantic ? truncateText(semantic, 200) : rollupLine,
    keys: [topic.key],
    meta: rollup?.meta,
    isTopic: true,
    memberCount: topic.memberIds.length,
  };
  acc.nodeIndex.set(categoryNode.id, acc.visibleNodes.length);
  acc.visibleNodes.push(categoryNode);
  if (centroid) acc.positions.set(categoryNode.id, centroid);
}
