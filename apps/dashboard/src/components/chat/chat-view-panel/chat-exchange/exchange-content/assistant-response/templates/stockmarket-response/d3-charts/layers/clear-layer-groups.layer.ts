import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';

/**
 * Empty the named chart-layer groups (all children removed, group kept). Used
 * by the style dispatchers to drop a layer the current style no longer draws,
 * and by visibility-gated layers to hide themselves.
 */
export function clearLayerGroups(
  ctx: D3ChartRenderContext,
  ...classNames: string[]
): void {
  for (const className of classNames) {
    const group = ctx.svg.select<SVGGElement>(`g.${className}`);
    if (!group.empty()) group.selectAll('*').remove();
  }
}
