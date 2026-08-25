import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationLink,
  ConstellationNode,
  ConstellationPosition,
  RelaxedLayout,
} from '../MemoryConstellation.types';
import { buildCommunities } from './build-communities.helper';
import {
  buildCommunityNode,
  communityNodeId,
} from './build-community-node.helper';
import { buildEdges } from './build-edges.helper';
import { clusterNodes } from './cluster-nodes.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';
import { layoutConstellation } from './layout-constellation.helper';
import { relaxConstellation } from './relax-constellation.helper';

/**
 * Seed position of one community hub: the mean of its member clusters'
 * centroids — the force pass then settles it between its clusters.
 */
function communitySeed(
  community: ConstellationCommunity,
  centroids: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (const clusterKey of community.memberClusterKeys) {
    const centroid = centroids.get(clusterKey);
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
 * Cluster + community + seed + relax every node once. Deterministic for a
 * given (nodes, links, minScore) triple; independent of which clusters are
 * expanded. Weak inter links (below `interLinkMinScore`) are excluded before
 * the force pass so unrelated clusters never pull together.
 */
export function buildRelaxedLayout(
  nodes: readonly ConstellationNode[],
  links: readonly ConstellationLink[],
  interLinkMinScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
): RelaxedLayout {
  const clusters: ConstellationCluster[] = clusterNodes(nodes);
  const communities = buildCommunities(nodes, clusters);
  const layout = layoutConstellation(nodes, clusters);
  const communityNodes = communities.map((community) =>
    buildCommunityNode(community),
  );
  const seed = new Map(layout.positions);
  for (const community of communities) {
    seed.set(
      communityNodeId(community.key),
      communitySeed(community, layout.centroids),
    );
  }
  const edges = buildEdges(
    clusters,
    links,
    new Set(),
    communities,
    interLinkMinScore,
  );
  const positions = relaxConstellation(
    [...nodes, ...communityNodes],
    edges,
    seed,
  );
  return { clusters, communities, positions };
}
