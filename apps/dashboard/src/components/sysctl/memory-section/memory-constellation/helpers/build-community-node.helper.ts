import type {
  ConstellationCommunity,
  ConstellationNode,
} from '../MemoryConstellation.types';

/** Synthetic node id of a community hub. */
export const communityNodeId = (key: string): string => `community:${key}`;

/**
 * The synthetic hub dot of one community: always visible, labeled with the
 * category, tooltip-carrying the topic/record counts, and clickable to
 * toggle every member cluster at once.
 */
export function buildCommunityNode(
  community: ConstellationCommunity,
): ConstellationNode {
  const topics = community.memberClusterKeys.length;
  const records = community.memberIds.length;
  const topicWord = topics === 1 ? 'topic' : 'topics';
  const recordWord = records === 1 ? 'record' : 'records';
  return {
    id: communityNodeId(community.key),
    label: community.label,
    clusterKey: community.key,
    communityKey: community.key,
    text: `${community.label} — ${topics} ${topicWord}, ${records} ${recordWord} — click to toggle`,
    summary: `${topics} ${topicWord} · ${records} ${recordWord}`,
    keys: [community.key],
    meta: [
      { label: 'category', value: community.label },
      { label: 'topics', value: String(topics) },
      { label: 'records', value: String(records) },
    ],
    isCommunity: true,
  };
}
