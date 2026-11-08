/** Default chart style preferences, set from the Settings chat-navigation tab. */
export type ChartPriceStyle = 'candles' | 'line' | 'area';
export type ChartVolumeStyle = 'histogram' | 'heatmap';
export type ChartHeatmapVariant = 'cells' | 'flow';
export type ChartColormap = 'turbo' | 'green' | 'purple';

/** Global defaults every stock chart inherits unless overridden per chart. */
export interface ChartConfig {
  /** Price-series rendering style. */
  priceStyle: ChartPriceStyle;
  /** Volume-series rendering style. */
  volumeStyle: ChartVolumeStyle;
  /** Heatmap cell interpolation variant. */
  heatmapVariant: ChartHeatmapVariant;
  /** Chart palette identifier. */
  colormap: ChartColormap;
  /** Whether chart markers are rendered. */
  showMarkers: boolean;
  /** Whether reference lines are rendered. */
  showReferenceLines: boolean;
  /** Whether the chart tooltip is enabled. */
  showTooltip: boolean;
}
