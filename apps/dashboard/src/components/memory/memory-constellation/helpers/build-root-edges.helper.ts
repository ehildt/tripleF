import type {
  ConstellationCluster,
  ConstellationEdge,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { mapClusterToRootEdge } from './map-cluster-to-root-edge.helper';
import { mapTopicToRootEdge } from './map-topic-to-root-edge.helper';

/**
 * Root edges: the top tier of the hierarchy connects to the ZERO root dot
 * with a dashed gray line. When the space has categories (clusters), each
 * category hub connects to the root (ZERO ← category ← sub-category), and
 * every topic that belongs to no cluster (no member carries a category —
 * e.g. the synthesized bridges tier, or facts not yet consolidated) connects
 * directly to the root. When there are no categories at all, every topic's
 * main dot connects directly to the root (ZERO ← main dot ← leaf).
 */
export function buildRootEdges(
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  if (clusters.length === 0) {
    return topics.map((topic) => mapTopicToRootEdge(topic, collapsedKeys));
  }
  const memberKeys = new Set(
    clusters.flatMap((cluster) => cluster.memberTopicKeys),
  );
  return [
    ...clusters.map(mapClusterToRootEdge),
    ...topics
      .filter((topic) => !memberKeys.has(topic.key))
      .map((topic) => mapTopicToRootEdge(topic, collapsedKeys)),
  ];
}
