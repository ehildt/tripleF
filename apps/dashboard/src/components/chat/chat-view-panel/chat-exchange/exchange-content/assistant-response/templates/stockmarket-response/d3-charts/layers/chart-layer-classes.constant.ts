/** DOM class names of the chart's layer groups. Owned here so the layer
 *  modules (which ensure their group) and the chart composable's dispatchers
 *  (which clear stale groups on style switches) can never drift apart. */
export const CHART_LAYER_CLASSES = {
  candles: 'd3-chart__candles',
  line: 'd3-chart__line',
  hlc: 'd3-chart__hlc',
  volume: 'd3-chart__volume',
  heatmap: 'd3-chart__heatmap',
  flow: 'd3-chart__flow',
  movingAverage: 'd3-chart__ma',
  referenceLines: 'd3-chart__reference-lines',
  markers: 'd3-chart__markers',
} as const;
