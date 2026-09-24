/**
 * Pixel width of one bar slot across the visible window: the plot width
 * divided by the visible bar count (never below one bar).
 */
export function computeBarSpacing(
  plotWidth: number,
  visibleBarCount: number,
): number {
  const span = Math.max(1, visibleBarCount);
  return plotWidth / span;
}
