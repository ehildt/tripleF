/** Cursor-to-tooltip gap — the panel floats clearly beside the pointer, never under it. */
export const CURSOR_GAP = 28;

/**
 * Position the tooltip panel relative to the cursor: place it after (right
 * of) the cursor, flip it before (left of) the cursor when it would overflow
 * the container's right edge, and clamp it vertically inside the container.
 */
export function computeTooltipPosition(
  point: { x: number; y: number },
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number } {
  let x = point.x + CURSOR_GAP;
  const maxX = containerWidth - width - CURSOR_GAP;
  if (x > maxX) {
    x = Math.max(CURSOR_GAP, point.x - CURSOR_GAP - width);
  }

  let y = point.y - height / 2;
  const maxY = containerHeight - height - CURSOR_GAP;
  y = Math.max(CURSOR_GAP, Math.min(y, maxY));
  return { x, y };
}
