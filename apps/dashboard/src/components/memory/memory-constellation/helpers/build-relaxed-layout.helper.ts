import type {
  ConstellationCluster,
  ConstellationClusterSummary,
  ConstellationLink,
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  RelaxedLayout,
} from '../MemoryConstellation.types';
import { attachClusterSummaries } from './attach-cluster-summaries.helper';
import { buildClusterNode, clusterNodeId } from './build-cluster-node.helper';
import { buildClusters } from './build-clusters.helper';
import { buildEdges } from './build-edges.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';
import { layoutConstellation } from './layout-constellation.helper';
import { relaxConstellation } from './relax-constellation.helper';
import { topicNodes } from './topic-nodes.helper';

/**
 * Seed position of one cluster hub: the mean of its member topics'
 * centroids — the force pass then settles it between its topics.
 */
function clusterSeed(
  cluster: ConstellationCluster,
  centroids: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const topicKey of cluster.memberTopicKeys) {
    const centroid = centroids.get(topicKey);
    if (!centroid) continue;
    x += centroid.x;
    y += centroid.y;
    z += centroid.z;
    count += 1;
  }
  if (count === 0) return { x: 0, y: 0, z: 0 };
  return { x: x / count, y: y / count, z: z / count };
}

/**
 * Cluster + cluster + seed + relax every node once. Deterministic for a
 * given (nodes, links, minScore) triple; independent of which topics are
 * expanded. Weak inter links (below `interLinkMinScore`) are excluded before
 * the force pass so unrelated topics never pull together.
 */
export function buildRelaxedLayout(
  nodes: readonly ConstellationNode[],
  links: readonly ConstellationLink[],
  interLinkMinScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
  serverClusters: readonly ConstellationClusterSummary[] = [],
): RelaxedLayout {
  const topics: ConstellationTopic[] = topicNodes(nodes);
  const clusters = attachClusterSummaries(
    buildClusters(nodes, topics),
    serverClusters,
  );
  const layout = layoutConstellation(nodes, topics);
  const clusterNodes = clusters.map((cluster) => buildClusterNode(cluster));
  const seed = new Map(layout.positions);
  for (const cluster of clusters) {
    seed.set(
      clusterNodeId(cluster.key),
      clusterSeed(cluster, layout.centroids),
    );
  }
  const edges = buildEdges(
    topics,
    links,
    new Set(),
    clusters,
    interLinkMinScore,
  );
  const positions = relaxConstellation(
    [...nodes, ...clusterNodes],
    edges,
    seed,
  );
  return { topics, clusters, positions };
}
