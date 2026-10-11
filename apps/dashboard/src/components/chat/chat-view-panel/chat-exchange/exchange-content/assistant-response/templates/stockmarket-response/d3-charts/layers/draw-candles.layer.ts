import { select } from 'd3-selection';

import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { D3ChartPoint } from '../D3Chart.types';
import { clampCenteredBarEdges } from '../helpers/clamp-centered-bar-edges.helper';
import { computeBarSpacing } from '../helpers/compute-bar-spacing.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** Draw the candlestick layer (wick line + body rect per visible bar). */
export function drawCandles(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
): void {
  const up = resolveColor('var(--color-status-success)', 1);
  const down = resolveColor('var(--color-status-error)', 1);
  const bodyWidth = Math.max(
    1,
    computeBarSpacing(
      ctx.plot.right - ctx.plot.left,
      ctx.visibleTo - ctx.visibleFrom,
    ) * 0.8,
  );
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.candles);
  const visible = points.slice(ctx.visibleFrom, ctx.visibleTo);
  const bars = group
    .selectAll<SVGGElement, D3ChartPoint>('g.d3-chart__candle')
    .data(visible, (point) => point.time);
  bars.exit().remove();
  const enter = bars.enter().append('g').attr('class', 'd3-chart__candle');
  enter.append('line').attr('class', 'd3-chart__wick');
  enter.append('rect').attr('class', 'd3-chart__body');
  bars.merge(enter).each(function (point, i) {
    const index = ctx.visibleFrom + i;
    const x = ctx.x(index);
    const color = point.close >= point.open ? up : down;
    select(this)
      .select('.d3-chart__wick')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', ctx.y(point.high))
      .attr('y2', ctx.y(point.low))
      .attr('stroke', color)
      .attr('stroke-width', 1);
    const yOpen = ctx.y(point.open);
    const yClose = ctx.y(point.close);
    // Clamp the body inside the plot so edge candles never bleed into the
    // y-axis gutter when zoomed in.
    const { left: bodyLeft, right: bodyRight } = clampCenteredBarEdges(
      x,
      bodyWidth / 2,
      ctx.plot.left,
      ctx.plot.right,
    );
    select(this)
      .select('.d3-chart__body')
      .attr('x', bodyLeft)
      .attr('width', Math.max(0, bodyRight - bodyLeft))
      .attr('y', Math.min(yOpen, yClose))
      .attr('height', Math.max(1, Math.abs(yClose - yOpen)))
      .attr('fill', color);
  });
}
