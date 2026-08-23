/**
 * Data contracts for the D3 chart group. Structurally identical to the
 * lightweight-charts-era types so the parent templates can bind the same
 * props, but owned by the D3 group so the old chart can be deleted without
 * touching this chart's inputs.
 */

/** One bar of price history. */
export interface D3ChartPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Per-day, per-price-band volume from the EODHD intraday tool. */
export interface D3VolumeProfilePoint {
  time: string;
  bands: Array<{ low: number; high: number; volume: number }>;
}

/** A dashed horizontal price line with a right-axis value badge. */
export interface D3ReferenceLine {
  value: number;
  label?: string;
  /** A theme token name, e.g. "accent-primary" or "status-error". */
  color?: string;
}

/** A chart annotation (e.g. a dividend "D" or a buy/sell signal). */
export interface D3ChartMarker {
  time: string;
  position: 'aboveBar' | 'belowBar';
  /** A theme token name, e.g. "harmony-3" or "status-error". */
  color?: string;
  shape: 'circle' | 'arrowUp' | 'arrowDown' | 'square';
  text?: string;
}

/** One named series of a stacked-area chart. */
export interface D3StackedAreaSeries {
  name: string;
  points: Array<{ time: string; value: number }>;
}

export type D3PriceStyle = 'candles' | 'line' | 'area';
export type D3VolumeStyle = 'histogram' | 'heatmap';
export type D3HeatmapVariant = 'cells' | 'flow';

/** Default style/annotation preferences applied when a chart mounts. */
export interface D3ChartDefaultConfig {
  priceStyle?: D3PriceStyle;
  volumeStyle?: D3VolumeStyle;
  heatmapVariant?: D3HeatmapVariant;
  showMarkers?: boolean;
  showReferenceLines?: boolean;
  showTooltip?: boolean;
}
