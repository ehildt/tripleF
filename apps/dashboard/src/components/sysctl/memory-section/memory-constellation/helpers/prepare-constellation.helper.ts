import type {
  ConstellationLink,
  ConstellationNode,
  PreparedConstellation,
  RelaxedLayout,
} from '../MemoryConstellation.types';
import { appendCommunityNodes } from './append-community-nodes.helper';
import { appendRootNode } from './append-root-node.helper';
import { buildClusterFog } from './build-cluster-fog.helper';
import { buildEdges } from './build-edges.helper';
import { buildHubIds } from './build-hub-ids.helper';
import { buildLinkCounts } from './build-link-counts.helper';
import { buildLinkIndices } from './build-link-indices.helper';
import { buildNodeColor } from './build-node-color.helper';
import { buildVisibleNodes } from './build-visible-nodes.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';

/**
 * Pure render-prep from a pre-relaxed layout: collapse the given cluster
 * keys into category dots, append the always-on community hubs and the ZERO
 * root, resolve links to visible nodes, and precompute edge opacity + fog.
 * Deterministic for a given (relaxedLayout, links, collapsedKeys,
 * interLinkMinScore) tuple.
 */
export function prepareConstellation(
  nodes: readonly ConstellationNode[],
  relaxedLayout: RelaxedLayout,
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  interLinkMinScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
): PreparedConstellation {
  const { clusters, communities, positions: relaxedPositions } = relaxedLayout;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const acc = buildVisibleNodes(
    clusters,
    relaxedPositions,
    nodeById,
    collapsedKeys,
  );
  appendCommunityNodes(communities, relaxedPositions, acc);
  appendRootNode(acc);
  const { visibleNodes, positions, nodeIndex } = acc;
  const edges = buildEdges(
    clusters,
    links,
    collapsedKeys,
    communities,
    interLinkMinScore,
  );
  const linkIndices = buildLinkIndices(edges, nodeIndex, interLinkMinScore);
  const linkCounts = buildLinkCounts(linkIndices, visibleNodes);
  const nodeColor = buildNodeColor(clusters, communities);
  const hubIds = buildHubIds(clusters, collapsedKeys, communities);
  const clusterFog = buildClusterFog(clusters, relaxedPositions, collapsedKeys);

  return {
    nodeList: visibleNodes,
    positions,
    linkIndices,
    linkCounts,
    nodeColor,
    hubIds,
    clusterFog,
  };
}
