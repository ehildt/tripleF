import { ZoomTransform } from 'd3-zoom';

import type { IndexWindow } from './compute-visible-window.helper';

/**
 * Build the d3-zoom transform that maps the base index scale's full domain
 * onto exactly the given window: after `transform.rescaleX(xBase)` the
 * domain equals `window`. Derived from the constraint that the plot's left
 * and right pixels must invert back to `window.from` and `window.to`, which
 * gives `k = (right - left) / (xBase(to) - xBase(from))`.
 */
export function buildZoomTransform(
  plotLeft: number,
  plotRight: number,
  xBase: (index: number) => number,
  window: IndexWindow,
): ZoomTransform {
  const fromX = xBase(window.from);
  const toX = xBase(window.to);
  const spanX = Math.max(toX - fromX, 1e-6);
  const k = (plotRight - plotLeft) / spanX;
  const tx = plotLeft - k * fromX;
  return new ZoomTransform(k, tx, 0);
}
