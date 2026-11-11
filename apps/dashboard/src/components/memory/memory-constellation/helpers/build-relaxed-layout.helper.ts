import type {
  ConstellationClusterSummary,
  ConstellationLink,
  ConstellationNode,
  ConstellationTopic,
  RelaxedLayout,
} from '../MemoryConstellation.types';
import { attachClusterSummaries } from './attach-cluster-summaries.helper';
import { buildClusterNode, clusterNodeId } from './build-cluster-node.helper';
import { buildClusterSeed } from './build-cluster-seed.helper';
import { buildClusters } from './build-clusters.helper';
import {
  attachCommunitiesToClusters,
  buildCommunities,
} from './build-communities.helper';
import {
  buildCommunityNode,
  communityNodeId,
} from './build-community-node.helper';
import { buildCommunitySeed } from './build-community-seed.helper';
import { buildEdges } from './build-edges.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';
import { layoutConstellation } from './layout-constellation.helper';
import { relaxConstellation } from './relax-constellation.helper';
import { topicNodes } from './topic-nodes.helper';

/**
 * Build the taxonomy, seed every real and synthetic node, then relax once.
 * Deterministic for a given (nodes, links, minScore, serverClusters) input;
 * independent of which topics are expanded. Weak inter links (below
 * `interLinkMinScore`) are excluded before the force pass so unrelated topics
 * never pull together. The synthetic community dots sit on the tier chain between the
 * cluster hub and their member topic hubs.
 */
export function buildRelaxedLayout(
  nodes: readonly ConstellationNode[],
  links: readonly ConstellationLink[],
  interLinkMinScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
  serverClusters: readonly ConstellationClusterSummary[] = [],
): RelaxedLayout {
  const topics: ConstellationTopic[] = topicNodes(nodes);
  const clustersBase = buildClusters(nodes, topics);
  const communities = buildCommunities(nodes, topics, clustersBase);
  const clusters = attachClusterSummaries(
    attachCommunitiesToClusters(clustersBase, communities),
    serverClusters,
  );
  const communityIdByTopic = new Map(
    communities.flatMap((community) =>
      community.memberTopicKeys.map((topicKey) => [topicKey, community.key]),
    ),
  );

  const layout = layoutConstellation(nodes, topics);
  const communityNodes = communities.map((community) =>
    buildCommunityNode(community),
  );
  const clusterNodes = clusters.map((cluster) => buildClusterNode(cluster));
  const seed = new Map(layout.positions);
  for (const community of communities) {
    seed.set(
      communityNodeId(community.key),
      buildCommunitySeed(community, layout.centroids),
    );
  }
  for (const cluster of clusters) {
    seed.set(
      clusterNodeId(cluster.key),
      buildClusterSeed(cluster, communityIdByTopic, layout.centroids, seed),
    );
  }
  const edges = buildEdges(
    topics,
    links,
    new Set(),
    clusters,
    interLinkMinScore,
    communities,
  );
  const positions = relaxConstellation(
    [...nodes, ...communityNodes, ...clusterNodes],
    edges,
    seed,
    interLinkMinScore,
  );
  return { topics, clusters, communities, positions };
}
