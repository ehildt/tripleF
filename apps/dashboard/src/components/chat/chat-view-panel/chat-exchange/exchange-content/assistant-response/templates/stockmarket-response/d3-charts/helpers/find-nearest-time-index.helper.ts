/**
 * Find the bar index whose time is closest to the target time. The history is
 * sorted by time, so a binary search finds the first index with a time at or
 * after the target, then the closer of that index and its predecessor wins.
 */
export function findNearestTimeIndex(
  timeOfIndex: (index: number) => string | undefined,
  length: number,
  target: string,
): number | undefined {
  if (length <= 0) return undefined;
  const targetMs = new Date(target).getTime();
  let lo = 0;
  let hi = length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const midTime = timeOfIndex(mid);
    if (!midTime) break;
    if (new Date(midTime).getTime() < targetMs) lo = mid + 1;
    else hi = mid;
  }
  let best = lo;
  let bestDist = Infinity;
  for (const i of [lo, lo - 1]) {
    if (i < 0 || i >= length) continue;
    const time = timeOfIndex(i);
    if (!time) continue;
    const dist = Math.abs(new Date(time).getTime() - targetMs);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}
