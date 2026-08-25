import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationEdge,
  ConstellationLink,
} from '../MemoryConstellation.types';
import { collectInterScores } from './collect-inter-scores.helper';
import { hubIdFor } from './hub-id-for.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';

/**
 * Inter edges: aggregate cross-cluster links into main-dot → main-dot edges.
 * Links below `minScore` never aggregate (nomic-family embedders score
 * unrelated texts ~0.5–0.55, so a low bar means "any nearest neighbor").
 * Same-community pairs become `sibling` edges (related sub-categories connect
 * directly); cross-community pairs become `inter` edges.
 */
export function buildInterEdges(
  clusters: readonly ConstellationCluster[],
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  communities: readonly ConstellationCommunity[] = [],
  minScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
): ConstellationEdge[] {
  const clusterByNode = new Map<string, string>();
  for (const cluster of clusters) {
    for (const memberId of cluster.memberIds) {
      clusterByNode.set(memberId, cluster.key);
    }
  }
  const communityByCluster = new Map<string, string>();
  for (const community of communities) {
    for (const clusterKey of community.memberClusterKeys) {
      communityByCluster.set(clusterKey, community.key);
    }
  }
  const clusterByKey = new Map(
    clusters.map((cluster) => [cluster.key, cluster]),
  );
  const interScores = collectInterScores(
    links,
    clusterByNode,
    communityByCluster,
    minScore,
  );
  const edges: ConstellationEdge[] = [];
  for (const [pairKey, interScore] of interScores) {
    const [keyA, keyB] = pairKey.split('\u0000');
    const clusterA = clusterByKey.get(keyA);
    const clusterB = clusterByKey.get(keyB);
    if (!clusterA || !clusterB) continue;
    edges.push({
      source: hubIdFor(clusterA, collapsedKeys),
      target: hubIdFor(clusterB, collapsedKeys),
      kind: interScore.sameCommunity ? 'sibling' : 'inter',
      score: interScore.score,
      suggested: interScore.suggested ? true : undefined,
    });
  }
  return edges;
}
