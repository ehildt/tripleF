import type {
  ConstellationCluster,
  ConstellationEdge,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { hubIdFor } from './hub-id-for.helper';

/**
 * Cluster edges: each member topic's main dot connects to its cluster
 * hub (the category dot when the topic is collapsed). Same-cluster
 * topics therefore relate through their shared category instead of a
 * direct hub-to-hub line.
 */
export function buildClusterEdges(
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  const edges: ConstellationEdge[] = [];
  for (const cluster of clusters) {
    for (const topicKey of cluster.memberTopicKeys) {
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
