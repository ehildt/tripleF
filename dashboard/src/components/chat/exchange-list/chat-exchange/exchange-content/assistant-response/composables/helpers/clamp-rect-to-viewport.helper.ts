export interface ViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const VIEWPORT_MARGIN_PX = 16;

/** Clamp a floating rect so it never leaves the viewport. */
export function clampRectToViewport(rect: ViewportRect): ViewportRect {
  return {
    x: Math.min(
      Math.max(0, rect.x),
      window.innerWidth - rect.width - VIEWPORT_MARGIN_PX,
    ),
    y: Math.min(
      Math.max(0, rect.y),
      window.innerHeight - rect.height - VIEWPORT_MARGIN_PX,
    ),
    width: rect.width,
    height: rect.height,
  };
}
