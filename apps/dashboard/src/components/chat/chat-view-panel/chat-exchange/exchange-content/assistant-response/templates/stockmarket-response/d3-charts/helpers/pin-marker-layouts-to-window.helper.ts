import type { MarkerLayout } from './build-marker-layout.helper';

/**
 * Pin the window-anchored marker layouts (the `pinToWindow` range extremes)
 * into the visible window, so they never disappear while the user zooms in
 * past their bars. Layouts are returned unchanged when the window is empty
 * or inverted.
 */
export function pinMarkerLayoutsToWindow(
  layouts: MarkerLayout[],
  from: number,
  to: number,
): MarkerLayout[] {
  if (to <= from) return layouts;
  return layouts.map((layout) =>
    layout.pinToWindow
      ? { ...layout, index: Math.min(to - 1, Math.max(from, layout.index)) }
      : layout,
  );
}
