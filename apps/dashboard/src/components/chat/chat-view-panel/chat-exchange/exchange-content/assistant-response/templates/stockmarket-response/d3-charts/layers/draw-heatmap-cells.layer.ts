import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { HeatmapDayCells } from '../helpers/build-heatmap-cells.helper.types';
import { clampCenteredBarEdges } from '../helpers/clamp-centered-bar-edges.helper';
import { computeBarSpacing } from '../helpers/compute-bar-spacing.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** One heatmap cell rect, clamped inside the plot. */
type HeatmapCellRect = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

/**
 * Draw the volume-heatmap layer: per-day price-band cells, colored by
 * density, clamped inside the plot on both axes so edge columns and
 * out-of-domain bands never bleed into the gutters when zoomed in.
 */
export function drawHeatmapCells(
  ctx: D3ChartRenderContext,
  days: HeatmapDayCells[],
  shadeCell: (amount: number) => string,
): void {
  const cellWidth = Math.max(
    1,
    computeBarSpacing(
      ctx.plot.right - ctx.plot.left,
      ctx.visibleTo - ctx.visibleFrom,
    ) * 0.9,
  );
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.heatmap);
  const cells: HeatmapCellRect[] = [];
  for (let i = ctx.visibleFrom; i < ctx.visibleTo; i++) {
    const day = days[i];
    if (!day) continue;
    // Clamp the cell inside the plot so edge columns never bleed into the
    // y-axis gutter when zoomed in.
    const { left: cellX, right: cellRight } = clampCenteredBarEdges(
      ctx.x(i),
      cellWidth / 2,
      ctx.plot.left,
      ctx.plot.right,
    );
    const clampedWidth = cellRight - cellX;
    if (clampedWidth <= 0) continue;
    for (const cell of day.cells) {
      // Clamp the cell vertically inside the plot so bands outside the
      // visible price domain never bleed into the x-axis gutter or above
      // the pane when zoomed in.
      const cellTop = Math.max(ctx.plot.top, ctx.y(cell.high));
      const cellBottom = Math.min(ctx.plot.bottom, ctx.y(cell.low));
      const clampedHeight = cellBottom - cellTop;
      if (clampedHeight <= 0) continue;
      cells.push({
        key: `${i}:${cell.low}`,
        x: cellX,
        y: cellTop,
        width: clampedWidth,
        height: clampedHeight,
        fill: shadeCell(cell.amount),
      });
    }
  }
  group
    .selectAll<SVGRectElement, HeatmapCellRect>('rect.d3-chart__heatmap-cell')
    .data(cells, (cell) => cell.key)
    .join((enter) =>
      enter.append('rect').attr('class', 'd3-chart__heatmap-cell'),
    )
    .attr('x', (cell) => cell.x)
    .attr('y', (cell) => cell.y)
    .attr('width', (cell) => cell.width)
    .attr('height', (cell) => cell.height)
    .attr('fill', (cell) => cell.fill);
}
