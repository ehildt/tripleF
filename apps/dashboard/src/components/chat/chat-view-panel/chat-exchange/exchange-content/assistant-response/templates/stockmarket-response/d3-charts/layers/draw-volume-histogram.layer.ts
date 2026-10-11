import { scaleLinear } from 'd3-scale';

import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { D3ChartPoint } from '../D3Chart.types';
import { clampCenteredBarEdges } from '../helpers/clamp-centered-bar-edges.helper';
import { computeBarSpacing } from '../helpers/compute-bar-spacing.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** Draw the volume histogram layer (bottom-quarter bars, up/down colored). */
export function drawVolumeHistogram(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
): void {
  const up = resolveColor('var(--color-status-success)', 1);
  const down = resolveColor('var(--color-status-error)', 1);
  const barWidth = Math.max(
    1,
    computeBarSpacing(
      ctx.plot.right - ctx.plot.left,
      ctx.visibleTo - ctx.visibleFrom,
    ) * 0.8,
  );
  const visible = points.slice(ctx.visibleFrom, ctx.visibleTo);
  // The volume bars share the single price y-axis: they sit in the bottom
  // quarter of the price pane, scaled to the visible volume range.
  const maxVolume = Math.max(1, ...visible.map((point) => point.volume));
  const bandTop = ctx.plot.bottom - (ctx.plot.bottom - ctx.plot.top) * 0.25;
  const volumeScale = scaleLinear()
    .domain([0, maxVolume])
    .range([ctx.plot.bottom, bandTop]);
  const zero = volumeScale(0);
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.volume);
  const bars = group
    .selectAll<SVGRectElement, D3ChartPoint>('rect.d3-chart__volume-bar')
    .data(visible, (point) => point.time);
  bars.exit().remove();
  bars
    .merge(bars.enter().append('rect').attr('class', 'd3-chart__volume-bar'))
    .attr('x', (_point, i) => {
      // Clamp the bar's left edge inside the plot: a bar centred on the
      // first visible index would otherwise bleed past the plot's left.
      const centerX = ctx.x(ctx.visibleFrom + i);
      return clampCenteredBarEdges(
        centerX,
        barWidth / 2,
        ctx.plot.left,
        ctx.plot.right,
      ).left;
    })
    .attr('width', (_point, i) => {
      // Clamp the right edge inside the plot so the last bar never bleeds
      // into the y-axis gutter when zoomed in.
      const centerX = ctx.x(ctx.visibleFrom + i);
      const { left, right } = clampCenteredBarEdges(
        centerX,
        barWidth / 2,
        ctx.plot.left,
        ctx.plot.right,
      );
      return Math.max(0, right - left);
    })
    .attr('y', (point) => volumeScale(point.volume))
    .attr('height', (point) => Math.max(0, zero - volumeScale(point.volume)))
    .attr('fill', (point) => (point.close >= point.open ? up : down));
}
