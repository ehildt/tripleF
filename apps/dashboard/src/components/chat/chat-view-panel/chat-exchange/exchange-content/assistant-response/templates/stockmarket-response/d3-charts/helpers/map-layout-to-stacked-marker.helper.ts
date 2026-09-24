import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable';
import { markerTextShift } from './marker-text-shift.helper';
import { splitMarkerText } from './split-marker-text.helper';
import type { StackedMarkerLayout } from './stack-marker-layouts.helper';

/** Project a stacked marker layout into its render-ready shape. */
export function mapLayoutToStackedMarker(
  layout: StackedMarkerLayout,
  ctx: D3ChartRenderContext,
  lineYs: number[],
) {
  const arrowY = ctx.y(layout.price) + layout.stackOffset;
  const hasText = Boolean(layout.text);
  return {
    layout,
    split: splitMarkerText(layout.text),
    textShift: hasText ? markerTextShift(arrowY, layout.textAbove, lineYs) : 0,
  };
}
