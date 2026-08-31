import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable';
import type { D3ChartPoint } from '../D3Chart.types';
import type { HlcPoint } from './build-hlc-area-paths.helper';

/** Project one chart point into HLC pixel geometry. */
export function mapPointToHlcPixel(
  point: D3ChartPoint,
  i: number,
  ctx: D3ChartRenderContext,
): HlcPoint {
  return {
    x: ctx.x(ctx.visibleFrom + i),
    high: ctx.y(point.high),
    low: ctx.y(point.low),
    close: ctx.y(point.close),
  };
}
