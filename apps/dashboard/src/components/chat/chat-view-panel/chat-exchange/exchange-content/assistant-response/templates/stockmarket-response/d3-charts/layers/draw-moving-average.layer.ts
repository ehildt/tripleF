import { line } from 'd3-shape';

import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { D3ChartPoint } from '../D3Chart.types';
import { resolveColor } from '../helpers/resolve-color.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** Draw the moving-average overlay layer over the visible bars. */
export function drawMovingAverage(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
  movingAverage: Array<number | undefined>,
): void {
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.movingAverage);
  const visible = points.slice(ctx.visibleFrom, ctx.visibleTo);
  const lineGen = line<D3ChartPoint>()
    .x((_point, i) => ctx.x(ctx.visibleFrom + i))
    .y((_point, i) => ctx.y(movingAverage[ctx.visibleFrom + i] ?? NaN))
    .defined((_point, i) => movingAverage[ctx.visibleFrom + i] !== undefined);
  group
    .selectAll('path')
    .data([visible])
    .join('path')
    .attr('d', lineGen)
    .attr('fill', 'none')
    .attr('stroke', resolveColor('var(--color-accent-primary)', 1))
    .attr('stroke-width', 1);
}
