import type {
  ConstellationCommunity,
  ConstellationFriction,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { buildHubMeta } from './build-hub-meta.helper';

/** Synthetic node id of a community hub. */
export const communityNodeId = (key: string): string => `community:${key}`;

/**
 * The synthetic hub dot of one community: always visible between its parent
 * cluster hub and its member topic hubs, tooltip-carrying the topic/record
 * counts, clickable to toggle every member topic at once.
 */
export function buildCommunityNode(
  community: ConstellationCommunity,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
): ConstellationNode {
  const topics = community.memberTopicKeys.length;
  const records = community.memberIds.length;
  const topicWord = topics === 1 ? 'topic' : 'topics';
  const recordWord = records === 1 ? 'record' : 'records';
  const members = nodeById
    ? community.memberIds
        .map((id) => nodeById.get(id))
        .filter((node): node is ConstellationNode => node !== undefined)
    : [];
  const rollup = nodeById
    ? buildHubMeta(members, frictions).meta.filter(
        (row) => row.label !== 'records',
      )
    : [];
  return {
    id: communityNodeId(community.key),
    label: community.label,
    topicKey: community.key,
    clusterKey: community.clusterKey,
    communityKey: community.key,
    text: `${community.label} — ${topics} ${topicWord}, ${records} ${recordWord} — click to toggle`,
    summary: `${topics} ${topicWord} · ${records} ${recordWord}`,
    keys: [community.key],
    meta: [
      { label: 'community', value: community.label },
      { label: 'cluster', value: community.clusterKey },
      { label: 'topics', value: String(topics) },
      { label: 'records', value: String(records) },
      ...rollup,
    ],
    isCommunity: true,
    memberCount: records,
  };
}
