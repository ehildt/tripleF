import type { Selection } from 'd3-selection';

import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { D3ChartPoint } from '../D3Chart.types';
import { buildHlcAreaPaths } from '../helpers/build-hlc-area-paths.helper';
import { mapPointToHlcPixel } from '../helpers/map-point-to-hlc-pixel.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** Apply `d`/fill/stroke attrs onto a layer group's named path, creating it
 *  on first render. */
function updatePath(
  group: Selection<SVGGElement, unknown, null, undefined>,
  className: string,
  attrs: Record<string, string | number>,
): Selection<SVGPathElement, unknown, null, undefined> {
  let path = group.select<SVGPathElement>(`path.${className}`);
  if (path.empty()) path = group.append('path').attr('class', className);
  for (const [name, value] of Object.entries(attrs)) path.attr(name, value);
  return path;
}

/** Draw the HLC area layer (top/bottom fills plus high/low/close outlines). */
export function drawHlcArea(
  ctx: D3ChartRenderContext,
  points: D3ChartPoint[],
): void {
  const visible = points.slice(ctx.visibleFrom, ctx.visibleTo);
  const pixelPoints = visible.map((point, i) =>
    mapPointToHlcPixel(point, i, ctx),
  );
  const paths = buildHlcAreaPaths(pixelPoints);
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.hlc);
  updatePath(group, 'd3-chart__hlc-area--top', {
    d: paths.topArea,
    fill: resolveColor('var(--color-status-success)', 0.2),
  });
  updatePath(group, 'd3-chart__hlc-area--bottom', {
    d: paths.bottomArea,
    fill: resolveColor('var(--color-status-error)', 0.2),
  });
  updatePath(group, 'd3-chart__hlc-line--high', {
    d: paths.highLine,
    fill: 'none',
    stroke: resolveColor('var(--color-status-success)', 1),
    'stroke-width': 1,
  });
  updatePath(group, 'd3-chart__hlc-line--low', {
    d: paths.lowLine,
    fill: 'none',
    stroke: resolveColor('var(--color-status-error)', 1),
    'stroke-width': 1,
  });
  updatePath(group, 'd3-chart__hlc-line--close', {
    d: paths.closeLine,
    fill: 'none',
    stroke: resolveColor('var(--color-fg-muted)', 1),
    'stroke-width': 1,
  });
}
