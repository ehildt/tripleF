import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { D3ChartPoint, D3ReferenceLine } from '../D3Chart.types';
import { dodgeBadgePositions } from '../helpers/dodge-badge-positions.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import { resolveTokenColor } from '../helpers/resolve-token-color.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** One reference line's render geometry: true price y plus dodged badge y. */
type ReferenceLineRenderItem = {
  key: string;
  y: number;
  badgeY: number;
  x: number;
  color: string;
  text: string;
};

/**
 * The x of the visible bar whose price is closest to the level — where the
 * dashed line crosses the actual value (the extreme bar for HIGH/LOW lines,
 * the tested bar for support/resistance). Falls back to the plot's left
 * edge when no bar is visible.
 */
function nearestBarX(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
  value: number,
): number {
  let bestIndex = -1;
  let bestDiff = Infinity;
  for (let i = ctx.visibleFrom; i < ctx.visibleTo; i++) {
    const point = points[i];
    if (!point) continue;
    const diff = Math.min(
      Math.abs(point.high - value),
      Math.abs(point.low - value),
      Math.abs(point.close - value),
    );
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return bestIndex >= 0 ? ctx.x(bestIndex) : ctx.plot.left;
}

/** Draw the reference-line layer: dashed level lines with a left-end dot
 *  and a right-gutter value badge that dodges neighbouring badges. */
export function drawReferenceLines(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
  levels: D3ReferenceLine[],
): void {
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.referenceLines);
  // Badge text sits on the colored badge background; the inverse foreground
  // keeps contrast in dark and light modes (same as the active page).
  const badgeText = resolveColor('var(--color-fg-inverse)', 1);
  const items: ReferenceLineRenderItem[] = [];
  for (const level of levels) {
    const y = ctx.y(level.value);
    if (y < ctx.plot.top - 10 || y > ctx.plot.bottom + 10) continue;
    items.push({
      key: String(level.value),
      y,
      badgeY: y,
      x: nearestBarX(ctx, points, level.value),
      color: resolveTokenColor(level.color, 1),
      text: level.label
        ? `${level.label} ${ctx.formatPrice(level.value)}`
        : ctx.formatPrice(level.value),
    });
  }
  // Near-identical levels overlap in pixel space even when their values
  // differ, so the badges dodge vertically; the dashed line and dot keep
  // the true price — only the badge moves.
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const badgeYs = dodgeBadgePositions(
    sorted.map((item) => item.y),
    { max: ctx.plot.bottom + 8 },
  );
  sorted.forEach((item, i) => {
    item.badgeY = badgeYs[i];
  });
  const joined = group
    .selectAll<SVGGElement, ReferenceLineRenderItem>('g.d3-chart__reference')
    .data(items, (item) => item.key)
    .join((enter) => {
      const refGroup = enter.append('g').attr('class', 'd3-chart__reference');
      refGroup.append('line').attr('class', 'd3-chart__reference-line');
      // A dot marks the line's left end, so every dashed level reads as a
      // bulleted annotation even without a marker on the bar.
      refGroup.append('circle').attr('class', 'd3-chart__reference-dot');
      const badge = refGroup
        .append('g')
        .attr('class', 'd3-chart__reference-badge');
      badge.append('rect').attr('class', 'd3-chart__reference-badge-bg');
      badge.append('text').attr('class', 'd3-chart__reference-badge-text');
      return refGroup;
    });
  joined
    .select('line.d3-chart__reference-line')
    .attr('x1', ctx.plot.left)
    // The dashed line runs through the y-axis gutter and connects to the
    // badge.
    .attr('x2', ctx.plot.right + 46)
    .attr('y1', (item) => item.y)
    .attr('y2', (item) => item.y)
    .attr('stroke', (item) => item.color);
  joined
    .select('circle.d3-chart__reference-dot')
    .attr('cx', (item) => item.x)
    .attr('cy', (item) => item.y)
    .attr('r', 3.5)
    .attr('fill', (item) => item.color);
  joined
    .select('g.d3-chart__reference-badge')
    .attr(
      'transform',
      (item) => `translate(${ctx.plot.right + 46}, ${item.badgeY})`,
    );
  joined
    .select('rect.d3-chart__reference-badge-bg')
    .attr('x', 0)
    .attr('y', -10)
    .attr('width', (item) => item.text.length * 6 + 12)
    .attr('height', 16)
    .attr('fill', (item) => item.color)
    .attr('opacity', 0.9);
  joined
    .select('text.d3-chart__reference-badge-text')
    .attr('x', (item) => (item.text.length * 6 + 12) / 2)
    .attr('y', 2)
    .attr('text-anchor', 'middle')
    .attr('fill', badgeText)
    .text((item) => item.text);
}
