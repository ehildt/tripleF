import type {
  D3ChartDefaultConfig,
  D3ChartMarker,
  D3ChartPoint,
  D3ReferenceLine,
  D3VolumeProfilePoint,
} from './D3Chart.types';

export interface D3UnifiedStockChartProps {
  history: D3ChartPoint[];
  currency?: string;
  referenceLines?: D3ReferenceLine[];
  markers?: D3ChartMarker[];
  /** Per-day, per-price-band volume from the EODHD intraday tool. */
  volumeProfile?: D3VolumeProfilePoint[];
  /**
   * The ticker's available date range from the cached history database, so
   * the range controls size to the data that actually exists.
   */
  availableRange?: { from: string; to: string } | null;
  /** Color scheme for the heatmap volume cells. */
  colormap?: 'turbo' | 'green' | 'purple';
  /** Default style/annotation preferences applied when the chart mounts. */
  defaultConfig?: D3ChartDefaultConfig;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  /** Whether the 1D (intraday) view is active. */
  intradayActive?: boolean;
  /**
   * Whether intraday bars were streamed; the 1D button renders disabled
   * when false.
   */
  intradayAvailable?: boolean;
  /** Switch to/from the 1D intraday view. */
  onIntraday?: () => void;
  /** Quote price shown in the chart controls. */
  quotePrice?: number;
  /** Absolute change shown next to the quote price. */
  quoteChange?: number;
  /** Percent change driving the quote's colour. */
  quoteChangeP?: number;
}
