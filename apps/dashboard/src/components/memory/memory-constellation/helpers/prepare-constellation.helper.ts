import type {
  ConstellationCluster,
  ConstellationFriction,
  ConstellationLink,
  ConstellationNode,
  ConstellationTopic,
  PreparedConstellation,
  RelaxedLayout,
} from '../MemoryConstellation.types';
import { appendClusterNodes } from './append-cluster-nodes.helper';
import { appendCommunityNodes } from './append-community-nodes.helper';
import { appendRootNode } from './append-root-node.helper';
import { buildEdges } from './build-edges.helper';
import { buildFrictionLinks } from './build-friction-links.helper';
import { buildHubIds } from './build-hub-ids.helper';
import { buildLinkCounts } from './build-link-counts.helper';
import { buildLinkIndices } from './build-link-indices.helper';
import { buildNodeColor } from './build-node-color.helper';
import { buildTopicFog } from './build-topic-fog.helper';
import { buildVisibleNodes } from './build-visible-nodes.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';

/**
 * Pure render-prep from a pre-relaxed layout: collapse the given topic
 * keys into category dots, append the always-on cluster hubs and the ZERO
 * root, resolve links to visible nodes, and precompute edge opacity + fog.
 * Deterministic for a given (relaxedLayout, links, frictions, collapsedKeys,
 * interLinkMinScore, showSuggested) tuple. When `showSuggested` is off, the
 * weak arcs (every inter edge below the strong-relation tier) are dropped
 * before both the render list and the per-node degree counts, so a node held
 * up only by weak links reads as unlinked.
 */
export function prepareConstellation(
  nodes: readonly ConstellationNode[],
  relaxedLayout: RelaxedLayout,
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  interLinkMinScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
  frictions: readonly ConstellationFriction[] = [],
  showSuggested = true,
): PreparedConstellation {
  const {
    topics,
    clusters,
    communities,
    positions: relaxedPositions,
  } = relaxedLayout;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const acc = buildVisibleNodes(
    topics,
    relaxedPositions,
    nodeById,
    collapsedKeys,
    frictions,
  );
  appendClusterNodes(clusters, relaxedPositions, acc, nodeById, frictions);
  appendCommunityNodes(communities, relaxedPositions, acc, nodeById, frictions);
  appendRootNode(
    acc,
    buildRootHealthMeta(nodes, topics, clusters, links, frictions),
  );
  const { visibleNodes, positions, nodeIndex } = acc;
  const edges = buildEdges(
    topics,
    links,
    collapsedKeys,
    clusters,
    interLinkMinScore,
    communities,
  );
  const linkIndices = [
    ...buildLinkIndices(edges, nodeIndex, interLinkMinScore),
    ...buildFrictionLinks(frictions, nodeIndex),
  ];
  const visibleLinkIndices = showSuggested
    ? linkIndices
    : linkIndices.filter((link) => !link.weak);
  const linkCounts = buildLinkCounts(visibleLinkIndices, visibleNodes);
  const nodeColor = buildNodeColor(topics, clusters, communities);
  const hubIds = buildHubIds(topics, collapsedKeys, clusters, communities);
  const topicFog = buildTopicFog(topics, relaxedPositions, collapsedKeys);

  return {
    nodeList: visibleNodes,
    positions,
    linkIndices: visibleLinkIndices,
    linkCounts,
    nodeColor,
    hubIds,
    topicFog,
  };
}

/**
 * The ZERO root's health overview: fact/topic/cluster/link/friction
 * counts plus the lone-fact count (real nodes not covered by any cluster
 * hub — the category-derived view's gap; the server's structural clusters
 * absorb these, so a non-zero count means the cluster job has not run yet).
 */
function buildRootHealthMeta(
  nodes: readonly ConstellationNode[],
  topics: readonly ConstellationTopic[],
  clusters: readonly ConstellationCluster[],
  links: readonly ConstellationLink[],
  frictions: readonly ConstellationFriction[],
): Array<{ label: string; value: string }> {
  const clusterMemberIds = new Set(
    clusters.flatMap((cluster) => cluster.memberIds),
  );
  const loneFacts = nodes.filter(
    (node) =>
      !node.isCluster &&
      !node.isRoot &&
      !node.isTopic &&
      !clusterMemberIds.has(node.id),
  ).length;
  const domains = new Set(
    nodes
      .map((node) => node.domain?.trim())
      .filter((domain): domain is string => Boolean(domain)),
  );
  const urls = new Set(
    nodes
      .map((node) => node.url?.trim())
      .filter((url): url is string => Boolean(url)),
  );
  return [
    { label: 'facts', value: String(nodes.length) },
    ...(domains.size > 0
      ? [
          {
            label: 'sources',
            value: `${domains.size} domains · ${urls.size} urls`,
          },
        ]
      : []),
    { label: 'lone facts', value: String(loneFacts) },
    { label: 'topics', value: String(topics.length) },
    { label: 'clusters', value: String(clusters.length) },
    { label: 'links', value: String(links.length) },
    { label: 'frictions', value: String(frictions.length) },
  ];
}
