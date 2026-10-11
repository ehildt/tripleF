import type { D3ChartRenderContext } from '../composables/use-d3-chart.composable.types';
import type { MarkerLayout } from '../helpers/build-marker-layout.helper';
import { mapLayoutToStackedMarker } from '../helpers/map-layout-to-stacked-marker.helper';
import { resolveMarkerSymbolPath } from '../helpers/resolve-marker-symbol-path.helper';
import type { SplitMarkerText } from '../helpers/split-marker-text.helper';
import {
  type StackedMarkerLayout,
  stackMarkerLayouts,
} from '../helpers/stack-marker-layouts.helper';
import { CHART_LAYER_CLASSES } from './chart-layer-classes.constant';
import { ensureLayerGroup } from './ensure-layer-group.layer';

/** Draw the buy/sell marker layer: stacked per-bar annotations with a
 *  three-row label column (word + price + arrow) anchored to the bar. */
export function drawChartMarkers(
  ctx: D3ChartRenderContext,
  markerLayouts: MarkerLayout[],
  lineYs: number[],
): void {
  const group = ensureLayerGroup(ctx, CHART_LAYER_CLASSES.markers);
  const visible = stackMarkerLayouts(
    markerLayouts.filter(
      (layout) =>
        layout.index >= ctx.visibleFrom && layout.index < ctx.visibleTo,
    ),
  ).map((layout) => mapLayoutToStackedMarker(layout, ctx, lineYs));
  const joined = group
    .selectAll<
      SVGGElement,
      {
        layout: StackedMarkerLayout;
        split: SplitMarkerText;
        textShift: number;
      }
    >('g.d3-chart__marker')
    // The key is unique per stack slot: stacked markers share the bar
    // index, and duplicate join keys would collapse them back together.
    .data(
      visible,
      (datum) =>
        `${datum.layout.index}:${datum.layout.stackOffset}:${datum.layout.symbol}`,
    )
    .join((enter) => {
      const markerGroup = enter.append('g').attr('class', 'd3-chart__marker');
      // Paint order: the label text first (furthest back), the price in the
      // center, and the arrow last (on top, over the dashed level line).
      markerGroup
        .append('text')
        .attr('class', 'd3-chart__marker-label d3-chart__marker-word');
      markerGroup
        .append('text')
        .attr('class', 'd3-chart__marker-label d3-chart__marker-price');
      markerGroup.append('path').attr('class', 'd3-chart__marker-shape');
      return markerGroup;
    });
  joined.attr(
    'transform',
    (datum) =>
      `translate(${ctx.x(datum.layout.index)}, ${ctx.y(datum.layout.price) + datum.layout.stackOffset})`,
  );
  joined
    .select('path.d3-chart__marker-shape')
    .attr('d', (datum) => resolveMarkerSymbolPath(datum.layout.symbol))
    .attr('transform', (datum) => {
      const y = datum.layout.textAbove ? -6 : 0;
      const rotate = datum.layout.symbol === 'arrowDown' ? ' rotate(180)' : '';
      return `translate(0, ${y})${rotate}`;
    })
    .attr('fill', (datum) => datum.layout.color ?? '');
  // The marker is a three-row column with the arrow anchored to the bar:
  // below-bar markers read arrow, price, word (top to bottom); above-bar
  // markers are the mirror — word, price, arrow — so the arrow always sits
  // nearest the bar, pointing at it. Word-only labels (e.g. a dividend "D")
  // sit right beside the arrow.
  const priceY = (textAbove: boolean) => (textAbove ? -15 : 20);
  const wordY = (textAbove: boolean, hasPrice: boolean): number => {
    if (!hasPrice) return priceY(textAbove);
    return textAbove ? -30 : 36;
  };
  joined
    .select('text.d3-chart__marker-price')
    .attr('x', 0)
    .attr('y', (datum) => priceY(datum.layout.textAbove) + datum.textShift)
    .attr('text-anchor', 'middle')
    .attr('fill', (datum) => datum.layout.color ?? '')
    .text((datum) => datum.split.price ?? '');
  joined
    .select('text.d3-chart__marker-word')
    .attr('x', 0)
    .attr(
      'y',
      (datum) =>
        wordY(datum.layout.textAbove, Boolean(datum.split.price)) +
        datum.textShift,
    )
    .attr('text-anchor', 'middle')
    .attr('fill', (datum) => datum.layout.color ?? '')
    .text((datum) => datum.split.word ?? '');
}
