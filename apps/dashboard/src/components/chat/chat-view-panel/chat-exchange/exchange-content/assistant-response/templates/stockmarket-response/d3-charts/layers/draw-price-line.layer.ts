import { line } from 'd3-shape';

import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { D3ChartPoint } from '../D3Chart.types';
import { resolveColor } from '../helpers/resolve-color.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** Draw the closing-price line layer (single stroked path over all bars). */
export function drawPriceLine(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
): void {
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.line);
  const visible = points.slice(ctx.visibleFrom, ctx.visibleTo);
  const lineGen = line<D3ChartPoint>()
    .x((_point, i) => ctx.x(ctx.visibleFrom + i))
    .y((point) => ctx.y(point.close))
    .defined((point) => Number.isFinite(point.close));
  group
    .selectAll('path')
    .data([visible])
    .join('path')
    .attr('d', lineGen)
    .attr('fill', 'none')
    .attr('stroke', resolveColor('var(--color-accent-primary)', 1))
    .attr('stroke-width', 2);
}
