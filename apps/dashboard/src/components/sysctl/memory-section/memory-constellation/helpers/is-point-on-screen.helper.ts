/** Screen margin (px) around the viewport for the culling test. */
const CULL_MARGIN = 40;

/**
 * Whether a projected point is inside the canvas viewport (with a margin so
 * dots just off-screen still render instead of popping in at the edge).
 */
export function isPointOnScreen(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return (
    x >= -CULL_MARGIN &&
    x <= width + CULL_MARGIN &&
    y >= -CULL_MARGIN &&
    y <= height + CULL_MARGIN
  );
}
