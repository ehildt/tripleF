import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import { clampToPlot } from '../helpers/clamp-to-plot.helper';
import type { FlowColumn } from '../helpers/compute-flow-columns.helper.types';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** One flow-ribbon quad between two adjacent flow columns. */
type FlowQuad = {
  key: string;
  d: string;
  fill: string;
};

/**
 * Draw the heatmap-flow layer: smoothed ribbons connecting each day's
 * centroid band to the next day's, clamped into the plot so bands outside
 * the visible price domain never bleed into the gutters when zoomed in.
 */
export function drawHeatmapFlow(
  ctx: D3ChartRenderContext,
  columns: FlowColumn[],
  shadeCell: (amount: number) => string,
): void {
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.flow);
  const quads: FlowQuad[] = [];
  for (let i = ctx.visibleFrom; i < ctx.visibleTo - 1; i++) {
    const a = columns[i];
    const b = columns[i + 1];
    if (!a || !b) continue;
    const x0 = ctx.x(i);
    const x1 = ctx.x(i + 1);
    // Clamp the ribbon into the plot. Quads entirely outside are skipped.
    const yTopA = clampToPlot(ctx.y(a.centroid + a.halfWidth), ctx.plot);
    const yTopB = clampToPlot(ctx.y(b.centroid + b.halfWidth), ctx.plot);
    const yBottomA = clampToPlot(ctx.y(a.centroid - a.halfWidth), ctx.plot);
    const yBottomB = clampToPlot(ctx.y(b.centroid - b.halfWidth), ctx.plot);
    if (
      yTopA <= ctx.plot.top &&
      yTopB <= ctx.plot.top &&
      yBottomA <= ctx.plot.top &&
      yBottomB <= ctx.plot.top
    ) {
      continue;
    }
    if (
      yTopA >= ctx.plot.bottom &&
      yTopB >= ctx.plot.bottom &&
      yBottomA >= ctx.plot.bottom &&
      yBottomB >= ctx.plot.bottom
    ) {
      continue;
    }
    quads.push({
      key: String(i),
      d: `M ${x0} ${yTopA} L ${x1} ${yTopB} L ${x1} ${yBottomB} L ${x0} ${yBottomA} Z`,
      fill: shadeCell(((a.intensity + b.intensity) / 2) * 100),
    });
  }
  group
    .selectAll<SVGPathElement, FlowQuad>('path.d3-chart__flow-quad')
    .data(quads, (quad) => quad.key)
    .join((enter) => enter.append('path').attr('class', 'd3-chart__flow-quad'))
    .attr('d', (quad) => quad.d)
    .attr('fill', (quad) => quad.fill);
}
