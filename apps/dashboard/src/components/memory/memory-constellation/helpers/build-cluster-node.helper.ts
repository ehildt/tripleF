import type {
  ConstellationCluster,
  ConstellationFriction,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { buildHubMeta } from './build-hub-meta.helper';
import { truncateText } from './truncate-text.helper';

/** Synthetic node id of a cluster hub. */
export const clusterNodeId = (key: string): string => `cluster:${key}`;

/**
 * The synthetic hub dot of one cluster: always visible, labeled with the
 * category, tooltip-carrying the topic/record counts, and clickable to
 * toggle every member topic at once. When the member lookup is provided,
 * the hub also carries the leaf rollup (sources, health, freshness).
 */
export function buildClusterNode(
  cluster: ConstellationCluster,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
): ConstellationNode {
  const topics = cluster.memberTopicKeys.length;
  const records = cluster.memberIds.length;
  const topicWord = topics === 1 ? 'topic' : 'topics';
  const recordWord = records === 1 ? 'record' : 'records';
  const label = cluster.title?.trim() || cluster.label;
  const members = nodeById
    ? cluster.memberIds
        .map((id) => nodeById.get(id))
        .filter((node): node is ConstellationNode => node !== undefined)
    : [];
  // The cluster's own rows already carry the record count — drop the
  // rollup's duplicate `records` row.
  const rollup = nodeById
    ? buildHubMeta(members, frictions).meta.filter(
        (row) => row.label !== 'records',
      )
    : [];
  const meta: Array<{ label: string; value: string }> = [
    { label: 'category', value: cluster.label },
    { label: 'topics', value: String(topics) },
    { label: 'records', value: String(records) },
    ...rollup,
  ];
  if (cluster.summary?.trim()) {
    meta.push({ label: 'summary', value: cluster.summary.trim() });
  }
  return {
    id: clusterNodeId(cluster.key),
    label,
    topicKey: cluster.key,
    clusterKey: cluster.key,
    text: cluster.summary?.trim()
      ? `${label} — ${cluster.summary.trim()}`
      : `${label} — ${topics} ${topicWord}, ${records} ${recordWord} — click to toggle`,
    summary: cluster.summary?.trim()
      ? truncateText(cluster.summary.trim(), 200)
      : `${topics} ${topicWord} · ${records} ${recordWord}`,
    keys: [cluster.key],
    meta,
    isCluster: true,
  };
}
