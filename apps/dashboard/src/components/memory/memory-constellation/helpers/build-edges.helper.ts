import type {
  ConstellationCluster,
  ConstellationEdge,
  ConstellationLink,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { buildClusterEdges } from './build-cluster-edges.helper';
import { buildInterEdges } from './build-inter-edges.helper';
import { buildIntraEdges } from './build-intra-edges.helper';
import { buildRootEdges } from './build-root-edges.helper';

/**
 * Build the rendered edge set: intra-topic (each leaf → its main dot),
 * inter-topic (main dot → main dot, aggregated from cross-topic links
 * above the minimum score), sibling (main dot → main dot within one
 * category), cluster (member topic hub → its category hub), and root
 * (category hub → ZERO). Collapsed topics contribute no intra edges (their
 * leaves are hidden) and their inter/sibling/cluster edges use the
 * synthetic category dot as the main dot.
 */
export function buildEdges(
  topics: readonly ConstellationTopic[],
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  clusters: readonly ConstellationCluster[] = [],
  minScore?: number,
): ConstellationEdge[] {
  return [
    ...buildIntraEdges(topics, collapsedKeys),
    ...buildInterEdges(topics, links, collapsedKeys, clusters, minScore),
    ...buildClusterEdges(topics, clusters, collapsedKeys),
    ...buildRootEdges(topics, clusters, collapsedKeys),
  ];
}
