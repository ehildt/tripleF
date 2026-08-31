import type { ConstellationLink } from '../MemoryConstellation.types';

/** Canonical pair key (sorted) of two topic keys. */
const pairKeyOf = (keyA: string, keyB: string): string =>
  keyA < keyB ? `${keyA}\u0000${keyB}` : `${keyB}\u0000${keyA}`;

/** One aggregated cross-topic pair: strongest score + suggestion flag. */
export interface InterScore {
  score: number;
  /** True when ANY contributing link is a topical (suggested) edge. */
  suggested: boolean;
  /** True when both topics share one cluster (a sibling link). */
  sameCluster: boolean;
}

/**
 * Aggregate eligible cross-topic links into a pairKey → strongest-score
 * map. A link is eligible when it clears `minScore` and connects two
 * different known topics. Same-cluster pairs are kept (flagged
 * `sameCluster`) so related sub-categories can connect directly; a pair is
 * marked `suggested` when any contributing link is a topical (relink-job)
 * edge.
 */
export function collectInterScores(
  links: readonly ConstellationLink[],
  topicByNode: ReadonlyMap<string, string>,
  clusterByTopic: ReadonlyMap<string, string>,
  minScore: number,
): Map<string, InterScore> {
  const interScores = new Map<string, InterScore>();
  for (const link of links) {
    if ((link.score ?? 0) < minScore) continue;
    const keyA = topicByNode.get(link.source);
    const keyB = topicByNode.get(link.target);
    if (!keyA || !keyB || keyA === keyB) continue;
    const clusterA = clusterByTopic.get(keyA);
    const sameCluster =
      clusterA != null && clusterA === clusterByTopic.get(keyB);
    const pairKey = pairKeyOf(keyA, keyB);
    const existing = interScores.get(pairKey);
    interScores.set(pairKey, {
      score: Math.max(existing?.score ?? 0, link.score ?? 0),
      suggested: (existing?.suggested ?? false) || link.suggested === true,
      sameCluster: (existing?.sameCluster ?? false) || sameCluster,
    });
  }
  return interScores;
}
