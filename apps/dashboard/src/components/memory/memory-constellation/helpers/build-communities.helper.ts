import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';

/**
 * Group topics into mid-tier communities by their members' `communityKey`
 * (a plural sub-family like `survival-games`) under an existing parent
 * cluster. A topic joins a community only when it ALSO belongs to the
 * parent cluster — community-less topics attach to the cluster directly.
 * Communities inherit the parent cluster's palette color. Deterministic:
 * first-seen community order.
 */
export function buildCommunities(
  nodes: readonly ConstellationNode[],
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[],
): ConstellationCommunity[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const clusterByKey = new Map(
    clusters.map((cluster) => [cluster.key, cluster]),
  );

  interface CommunityGroup {
    clusterKey: string;
    topicKeys: string[];
    memberIds: string[];
  }
  const groups = new Map<string, CommunityGroup>();
  for (const topic of topics) {
    const memberNodes = topic.memberIds
      .map((id) => nodeById.get(id))
      .filter((node): node is ConstellationNode => node !== undefined);
    const communityKey = memberNodes
      .map((node) => node.communityKey?.trim())
      .find((key) => Boolean(key));
    const clusterKey = memberNodes
      .map((node) => node.clusterKey?.trim())
      .find((key) => Boolean(key));
    // No community (or a community without a parent cluster in view) → the
    // topic stays a direct cluster member.
    if (!communityKey || !clusterKey || !clusterByKey.has(clusterKey)) continue;
    const group = groups.get(communityKey) ?? {
      clusterKey,
      topicKeys: [],
      memberIds: [],
    };
    group.topicKeys.push(topic.key);
    group.memberIds.push(...topic.memberIds);
    groups.set(communityKey, group);
  }
  return [...groups.entries()].map(([key, group]) => ({
    key,
    label: key,
    color: clusterByKey.get(group.clusterKey)?.color ?? '#94a3b8',
    clusterKey: group.clusterKey,
    memberTopicKeys: group.topicKeys,
    memberIds: group.memberIds,
  }));
}

/** Attach each cluster's community children to the cluster entries. */
export function attachCommunitiesToClusters(
  clusters: readonly ConstellationCluster[],
  communities: readonly ConstellationCommunity[],
): ConstellationCluster[] {
  return clusters.map((cluster) => ({
    ...cluster,
    memberCommunityKeys: communities
      .filter((community) => community.clusterKey === cluster.key)
      .map((community) => community.key),
  }));
}
