import type { ScaleLinear } from 'd3-scale';
import { ZoomTransform } from 'd3-zoom';

import { buildZoomTransform } from './build-zoom-transform.helper';
import { clampWindow } from './clamp-window.helper';
import type { D3ChartPlot } from './compute-plot.helper';

/**
 * Snap a raw d3-zoom gesture transform into the territory the user is
 * allowed to see: the visible index window is clamped into
 * [`rangeFrom`, `dataLength`] while keeping its span, and the transform is
 * rebuilt to map exactly the clamped window onto the plot. The vertical pan
 * position (transform y) is preserved. Transforms already inside the
 * territory are returned unchanged (compared by identity, so callers can
 * detect whether anything was clamped).
 */
export function confineZoomTransform(
  transform: ZoomTransform,
  plot: D3ChartPlot,
  xBase: ScaleLinear<number, number>,
  dataLength: number,
  rangeFrom: number,
): ZoomTransform {
  if (dataLength <= 0) return transform;
  const domain = transform.rescaleX(xBase).domain();
  const window = clampWindow(
    { from: domain[0], to: domain[1] },
    dataLength,
    rangeFrom,
    dataLength,
  );
  if (window.from === domain[0] && window.to === domain[1]) return transform;
  const confined = buildZoomTransform(plot.left, plot.right, xBase, window);
  return new ZoomTransform(confined.k, confined.x, transform.y);
}
