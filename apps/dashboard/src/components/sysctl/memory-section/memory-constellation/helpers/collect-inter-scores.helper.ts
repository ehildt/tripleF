import type { ConstellationLink } from '../MemoryConstellation.types';

/** Canonical pair key (sorted) of two cluster keys. */
const pairKeyOf = (keyA: string, keyB: string): string =>
  keyA < keyB ? `${keyA}\u0000${keyB}` : `${keyB}\u0000${keyA}`;

/** One aggregated cross-cluster pair: strongest score + suggestion flag. */
export interface InterScore {
  score: number;
  /** True when ANY contributing link is a topical (suggested) edge. */
  suggested: boolean;
  /** True when both clusters share one community (a sibling link). */
  sameCommunity: boolean;
}

/**
 * Aggregate eligible cross-cluster links into a pairKey → strongest-score
 * map. A link is eligible when it clears `minScore` and connects two
 * different known clusters. Same-community pairs are kept (flagged
 * `sameCommunity`) so related sub-categories can connect directly; a pair is
 * marked `suggested` when any contributing link is a topical (relink-job)
 * edge.
 */
export function collectInterScores(
  links: readonly ConstellationLink[],
  clusterByNode: ReadonlyMap<string, string>,
  communityByCluster: ReadonlyMap<string, string>,
  minScore: number,
): Map<string, InterScore> {
  const interScores = new Map<string, InterScore>();
  for (const link of links) {
    if ((link.score ?? 0) < minScore) continue;
    const keyA = clusterByNode.get(link.source);
    const keyB = clusterByNode.get(link.target);
    if (!keyA || !keyB || keyA === keyB) continue;
    const communityA = communityByCluster.get(keyA);
    const sameCommunity =
      communityA != null && communityA === communityByCluster.get(keyB);
    const pairKey = pairKeyOf(keyA, keyB);
    const existing = interScores.get(pairKey);
    interScores.set(pairKey, {
      score: Math.max(existing?.score ?? 0, link.score ?? 0),
      suggested: (existing?.suggested ?? false) || link.suggested === true,
      sameCommunity: (existing?.sameCommunity ?? false) || sameCommunity,
    });
  }
  return interScores;
}
