import type { Selection } from 'd3-selection';

import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';

/**
 * Get (or create) the svg group a chart layer draws into: an existing
 * `g.{className}` under the chart root, else a newly appended one.
 */
export function ensureLayerGroup(
  ctx: D3ChartRenderContext,
  className: string,
): Selection<SVGGElement, unknown, null, undefined> {
  const existing = ctx.svg.select<SVGGElement>(`g.${className}`);
  if (!existing.empty()) return existing;
  return ctx.svg.append('g').attr('class', className);
}
