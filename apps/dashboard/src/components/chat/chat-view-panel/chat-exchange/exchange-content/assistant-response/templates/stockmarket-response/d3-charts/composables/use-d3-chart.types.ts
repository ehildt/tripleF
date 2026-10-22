import type { ScaleLinear } from 'd3-scale';
import type { Selection } from 'd3-selection';
import type { Ref } from 'vue';

import type { D3ChartPlot } from '../helpers/compute-plot.helper';

/** The bars the chart knows about for domain/crosshair lookups. */
export interface D3ChartPointLike {
  time: string;
  high: number;
  low: number;
  volume: number;
}

/** Everything a leaf render pass needs to draw its series. */
export interface D3ChartRenderContext {
  svg: Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  plot: D3ChartPlot;
  /** Index scale with the current visible window as domain. */
  x: ScaleLinear<number, number>;
  /** Price scale over the visible bars. */
  y: ScaleLinear<number, number>;
  /** Volume scale (same range as `y` when the scales are not split). */
  yVolume: ScaleLinear<number, number>;
  /** First visible index (inclusive). */
  visibleFrom: number;
  /** Last visible index (exclusive). */
  visibleTo: number;
  /** The bar time at a fractional index, for axis and crosshair labels. */
  timeOfIndex: (index: number) => string | undefined;
  formatPrice: (price: number) => string;
  /** Re-render (after a leaf's internal state changed). */
  renderAll: () => void;
}

/** One crosshair position, emitted to tooltip subscribers. */
export interface D3CrosshairEvent {
  /** Pixel x of the snapped bar center. */
  x: number;
  /** Pixel y of the cursor. */
  y: number;
  index: number;
  time: string;
  price: number;
}

export interface UseD3ChartOptions {
  containerRef: Ref<HTMLDivElement | null>;
  /** Number of bars the range windowing is sized against. */
  getDataLength: () => number;
  /** Read a bar by index for domain/crosshair lookups. */
  getPoint: (index: number) => D3ChartPointLike | undefined;
  /** Price formatting for the right axis and crosshair label. */
  formatPrice: (price: number) => string;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  /** Reactive sources whose changes trigger re-render + re-windowing. */
  watchSources?: () => unknown[];
  /** Whether the y scale is split into price + volume bands. */
  volumeSplit: () => boolean;
  /** Pixel headroom above/below the price domain (marker labels). */
  markerHeadroomPx: () => number;
  /**
   * Prices of markers that must stay in view while panning (index + price
   * pairs). The engine expands the fitted y domain to include any visible
   * marker price, so markers never float above or below the plot.
   */
  getMarkerPrices?: () => Array<{ index: number; price: number }>;
  /**
   * Width of the right gutter (price labels + reference-line badges). The
   * leaf sizes it to fit its longest badge so badges never clip.
   */
  rightGutterWidth?: () => number;
  /** Whether the crosshair is drawn and its events emitted. */
  crosshair?: boolean;
  /**
   * Ref the engine updates with the current visible bar window (integer
   * `[from, to)` indices) on every render, so leaves can derive range-based
   * annotations (e.g. the ATH/ATL markers) from what is actually shown.
   */
  visibleWindowRef?: Ref<{ from: number; to: number }>;
  /** Draw the leaf's layers. */
  render: (ctx: D3ChartRenderContext) => void;
}
