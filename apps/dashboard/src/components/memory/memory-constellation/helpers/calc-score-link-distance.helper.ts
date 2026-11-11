/** Target distance for the strongest scored link (cosine similarity 1). */
const MIN_SCORED_LINK_DISTANCE = 30;
/** Target distance for the weakest scored link still visible at the cutoff. */
const MAX_SCORED_LINK_DISTANCE = 280;

/**
 * Calculate a non-linear 3D link target distance from cosine similarity.
 * Scores are normalized over the visible `[minScore, 1]` band before squaring
 * their weakness, so changing the cutoff does not compress every link toward
 * the minimum distance. Missing scores receive the weakest visible separation.
 */
export function calcScoreLinkDistance(
  score: number | undefined,
  minScore: number,
): number {
  if (score === undefined) return MAX_SCORED_LINK_DISTANCE;
  const scoreRange = 1 - minScore;
  const normalizedScore =
    scoreRange <= 0
      ? 1
      : Math.max(0, Math.min(1, (score - minScore) / scoreRange));
  const weakness = 1 - normalizedScore;
  return (
    MIN_SCORED_LINK_DISTANCE +
    weakness * weakness * (MAX_SCORED_LINK_DISTANCE - MIN_SCORED_LINK_DISTANCE)
  );
}
