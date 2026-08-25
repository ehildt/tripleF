/**
 * Pan-adjusted view center (zoom-to-cursor) plus the focus anchor — the
 * cursor when the pointer is over the canvas, else the view center.
 */
export function computeViewCenter(
  panX: number,
  panY: number,
  zoom: number,
  mouseX: number,
  mouseY: number,
  cx: number,
  cy: number,
): { viewCx: number; viewCy: number; focusX: number; focusY: number } {
  return {
    viewCx: cx - panX * zoom,
    viewCy: cy - panY * zoom,
    focusX: mouseX >= 0 ? mouseX : cx,
    focusY: mouseY >= 0 ? mouseY : cy,
  };
}
