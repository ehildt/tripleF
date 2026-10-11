/** A bar/cell edge pair, clamped inside the plot. */
type ClampedBarEdges = {
  /** Left edge, never outside the plot. */
  left: number;
  /** Right edge, never outside the plot. */
  right: number;
};

/**
 * Clamp the edges of a bar centered at `centerX` inside the plot, so edge
 * columns never bleed into an axis gutter when zoomed in. Half-width is
 * half the bar's visual width (spacing × fill ratio).
 */
export function clampCenteredBarEdges(
  centerX: number,
  halfWidth: number,
  plotLeft: number,
  plotRight: number,
): ClampedBarEdges {
  const left = Math.max(plotLeft, Math.min(centerX - halfWidth, plotRight));
  const right = Math.max(plotLeft, Math.min(centerX + halfWidth, plotRight));
  return { left, right };
}
