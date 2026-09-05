import type {
  ConstellationCluster,
  ConstellationClusterSummary,
  ConstellationCommunity,
  ConstellationLink,
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
  RelaxedLayout,
} from '../MemoryConstellation.types';
import { attachClusterSummaries } from './attach-cluster-summaries.helper';
import { buildClusterNode, clusterNodeId } from './build-cluster-node.helper';
import { buildClusters } from './build-clusters.helper';
import {
  attachCommunitiesToClusters,
  buildCommunities,
} from './build-communities.helper';
import {
  buildCommunityNode,
  communityNodeId,
} from './build-community-node.helper';
import { buildEdges } from './build-edges.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';
import { layoutConstellation } from './layout-constellation.helper';
import { relaxConstellation } from './relax-constellation.helper';
import { topicNodes } from './topic-nodes.helper';

/** Mean of the given positions (the seed of one synthetic hub dot). */
function meanPosition(
  seeds: ReadonlyArray<ConstellationPosition | undefined>,
): ConstellationPosition {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const seed of seeds) {
    if (!seed) continue;
    x += seed.x;
    y += seed.y;
    z += seed.z;
    count += 1;
  }
  if (count === 0) return { x: 0, y: 0, z: 0 };
  return { x: x / count, y: y / count, z: z / count };
}

/** Seed of a community hub: the mean of its member topics' centroids. */
function communitySeed(
  community: ConstellationCommunity,
  centroids: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition {
  return meanPosition(
    community.memberTopicKeys.map((topicKey) => centroids.get(topicKey)),
  );
}

/**
 * Seed of a cluster hub: the mean of its community seeds plus its
 * community-less member topics' centroids — the force pass then settles it
 * between them.
 */
function clusterSeed(
  cluster: ConstellationCluster,
  communityIdByTopic: ReadonlyMap<string, string>,
  centroids: ReadonlyMap<string, ConstellationPosition>,
  seed: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition {
  return meanPosition([
    ...cluster.memberCommunityKeys.map((communityKey) =>
      seed.get(communityNodeId(communityKey)),
    ),
    ...cluster.memberTopicKeys
      .filter((topicKey) => !communityIdByTopic.has(topicKey))
      .map((topicKey) => centroids.get(topicKey)),
  ]);
}

/**
 * Cluster + community + cluster + seed + relax every node once.
 * Deterministic for a given (nodes, links, minScore) triple; independent of
 * which topics are expanded. Weak inter links (below `interLinkMinScore`)
 * are excluded before the force pass so unrelated topics never pull
 * together. The synthetic community dots sit on the tier chain between the
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
      communitySeed(community, layout.centroids),
    );
  }
  for (const cluster of clusters) {
    seed.set(
      clusterNodeId(cluster.key),
      clusterSeed(cluster, communityIdByTopic, layout.centroids, seed),
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
  );
  return { topics, clusters, communities, positions };
}
