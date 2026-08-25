import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
  ConstellationLink,
} from '../MemoryConstellation.types';
import { buildCommunityEdges } from './build-community-edges.helper';
import { buildInterEdges } from './build-inter-edges.helper';
import { buildIntraEdges } from './build-intra-edges.helper';
import { buildRootEdges } from './build-root-edges.helper';

/**
 * Build the rendered edge set: intra-cluster (each leaf → its main dot),
 * inter-cluster (main dot → main dot, aggregated from cross-cluster links
 * above the minimum score), sibling (main dot → main dot within one
 * category), community (member cluster hub → its category hub), and root
 * (category hub → ZERO). Collapsed clusters contribute no intra edges (their
 * leaves are hidden) and their inter/sibling/community edges use the
 * synthetic category dot as the main dot.
 */
export function buildEdges(
  clusters: readonly ConstellationCluster[],
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  communities: readonly ConstellationCommunity[] = [],
  minScore?: number,
): ConstellationEdge[] {
  return [
    ...buildIntraEdges(clusters, collapsedKeys),
    ...buildInterEdges(clusters, links, collapsedKeys, communities, minScore),
    ...buildCommunityEdges(clusters, communities, collapsedKeys),
    ...buildRootEdges(clusters, communities, collapsedKeys),
  ];
}
