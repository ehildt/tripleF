import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
  ConstellationLink,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { buildClusterEdges } from './build-cluster-edges.helper';
import { buildCommunityEdges } from './build-community-edges.helper';
import { buildInterEdges } from './build-inter-edges.helper';
import { buildIntraEdges } from './build-intra-edges.helper';
import { buildRootEdges } from './build-root-edges.helper';

/**
 * Build the rendered edge set: intra-topic (each leaf → its main dot),
 * inter-topic (main dot → main dot, aggregated from cross-topic links
 * above the minimum score), sibling (main dot → main dot within one
 * category), community (member topic hub → community hub), cluster
 * (community/community-less hubs → category hub), and root
 * (category hub → ZERO). The main dot of a multi-member topic is the
 * synthetic title dot when it exists (collapsed, or always under the
 * main-node regime), else the first member. Collapsed topics contribute no
 * intra edges (their leaves are hidden).
 */
export function buildEdges(
  topics: readonly ConstellationTopic[],
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  clusters: readonly ConstellationCluster[] = [],
  minScore?: number,
  communities: readonly ConstellationCommunity[] = [],
  mainNodesEnabled = false,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  visibleNodeIds?: ReadonlySet<string>,
): ConstellationEdge[] {
  return [
    ...buildIntraEdges(
      topics,
      collapsedKeys,
      mainNodesEnabled,
      nodeById,
      visibleNodeIds,
    ),
    ...buildInterEdges(
      topics,
      links,
      collapsedKeys,
      clusters,
      minScore,
      mainNodesEnabled,
    ),
    ...buildCommunityEdges(
      topics,
      communities,
      collapsedKeys,
      mainNodesEnabled,
    ),
    ...buildClusterEdges(
      topics,
      clusters,
      collapsedKeys,
      communities,
      mainNodesEnabled,
    ),
    ...buildRootEdges(topics, clusters, collapsedKeys, mainNodesEnabled),
  ];
}
