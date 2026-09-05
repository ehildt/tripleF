import type {
  ConstellationCluster,
  ConstellationEdge,
  ConstellationLink,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { collectInterScores } from './collect-inter-scores.helper';
import { hubIdFor } from './hub-id-for.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';

/**
 * Inter edges: aggregate cross-topic links into main-dot → main-dot edges.
 * Links below `minScore` never aggregate (nomic-family embedders score
 * unrelated texts ~0.5–0.55, so a low bar means "any nearest neighbor").
 * Same-cluster pairs become `sibling` edges (related sub-categories connect
 * directly); cross-cluster pairs become `inter` edges.
 */
export function buildInterEdges(
  topics: readonly ConstellationTopic[],
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string>,
  clusters: readonly ConstellationCluster[] = [],
  minScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
): ConstellationEdge[] {
  const topicByNode = new Map<string, string>();
  for (const topic of topics) {
    for (const memberId of topic.memberIds) {
      topicByNode.set(memberId, topic.key);
    }
  }
  const clusterByTopic = new Map<string, string>();
  for (const cluster of clusters) {
    for (const topicKey of cluster.memberTopicKeys) {
      clusterByTopic.set(topicKey, cluster.key);
    }
  }
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  const interScores = collectInterScores(
    links,
    topicByNode,
    clusterByTopic,
    minScore,
  );
  const edges: ConstellationEdge[] = [];
  for (const [pairKey, interScore] of interScores) {
    const [keyA, keyB] = pairKey.split('\u0000');
    const topicA = topicByKey.get(keyA);
    const topicB = topicByKey.get(keyB);
    if (!topicA || !topicB) continue;
    edges.push({
      source: hubIdFor(topicA, collapsedKeys),
      target: hubIdFor(topicB, collapsedKeys),
      kind: interScore.sameCluster ? 'sibling' : 'inter',
      score: interScore.score,
      suggested: interScore.suggested ? true : undefined,
    });
  }
  return edges;
}
