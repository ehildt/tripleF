import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { communityNodeId } from './build-community-node.helper';
import { hubIdFor } from './hub-id-for.helper';

/**
 * Cluster edges: the tier chain into the category hub. Member topics WITHOUT
 * a community connect straight to the cluster hub; topics inside a community
 * chain through it (see buildCommunityEdges), and the community hubs connect
 * up to the cluster hub. Same-cluster topics therefore relate through their
 * shared category instead of a direct hub-to-hub line.
 */
export function buildClusterEdges(
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[],
  collapsedKeys: ReadonlySet<string>,
  communities: readonly ConstellationCommunity[] = [],
): ConstellationEdge[] {
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  const communityByTopic = new Map(
    communities.flatMap((community) =>
      community.memberTopicKeys.map((topicKey) => [topicKey, community.key]),
    ),
  );
  const edges: ConstellationEdge[] = [];
  for (const cluster of clusters) {
    for (const communityKey of cluster.memberCommunityKeys) {
      edges.push({
        source: communityNodeId(communityKey),
        target: clusterNodeId(cluster.key),
        kind: 'cluster',
      });
    }
    for (const topicKey of cluster.memberTopicKeys) {
      if (communityByTopic.has(topicKey)) continue;
      const topic = topicByKey.get(topicKey);
      if (!topic) continue;
      edges.push({
        source: hubIdFor(topic, collapsedKeys),
        target: clusterNodeId(cluster.key),
        kind: 'cluster',
      });
    }
  }
  return edges;
}
