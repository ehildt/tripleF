/** Ease-out cubic (fast start, slow end) — the "explode" burst. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
