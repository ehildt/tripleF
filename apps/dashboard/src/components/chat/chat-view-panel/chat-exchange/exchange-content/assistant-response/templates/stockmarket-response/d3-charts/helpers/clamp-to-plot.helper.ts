import type { D3ChartPlot } from './compute-plot.helper';

/** Clamp a pixel y coordinate into the plot's vertical span. */
export function clampToPlot(y: number, plot: D3ChartPlot): number {
  return Math.max(plot.top, Math.min(y, plot.bottom));
}
