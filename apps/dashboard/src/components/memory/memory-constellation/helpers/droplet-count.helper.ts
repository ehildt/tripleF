/** Minimum droplets traveling along an edge. */
const MIN_DROPLETS = 3;
/** Maximum droplets traveling along an edge. */
const MAX_DROPLETS = 10;

/**
 * Droplet count for an edge: scales with its cosine score — the stronger the
 * relation, the more traffic flows along it. Unscored (structural) edges get
 * the minimum.
 */
export function dropletCount(score: number | undefined): number {
  const clamped = Math.max(0, Math.min(1, score ?? 0));
  return Math.round(MIN_DROPLETS + (MAX_DROPLETS - MIN_DROPLETS) * clamped);
}
