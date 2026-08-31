import type { ConstellationCommunity } from '../MemoryConstellation.types';

/** Categorical palette for community hubs (stable by community order). */
const COMMUNITY_PALETTE = [
  '#f97316',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#6366f1',
];

/** Build one community hub from a key/cluster-keys pair. */
export function mapCommunityEntry(
  [key, clusterKeys]: [string, string[]],
  index: number,
  memberIdsByCommunity: Map<string, string[]>,
): ConstellationCommunity {
  return {
    key,
    label: key,
    color: COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length],
    memberClusterKeys: clusterKeys,
    memberIds: memberIdsByCommunity.get(key) ?? [],
  };
}
