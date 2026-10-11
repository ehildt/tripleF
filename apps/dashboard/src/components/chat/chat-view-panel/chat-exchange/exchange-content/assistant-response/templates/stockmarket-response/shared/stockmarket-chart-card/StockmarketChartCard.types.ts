export interface StockmarketChartTab {
  /** Value used by the `v-model` active-tab binding. */
  id: string;
  /** Human-readable label shown on the tab button. */
  label: string;
}

/** Props for `StockmarketChartCard`, the chart card with tabs and ticker selector. */
export interface StockmarketChartCardProps {
  /** Chart tabs rendered above the chart content. */
  tabs: StockmarketChartTab[];
  /** Optional ticker list for the single-instrument charts. */
  tickers?: string[];
  /**
   * Whether to show the ticker selector. When omitted, it shows whenever
   * more than one ticker is available.
   */
  showTickerSelector?: boolean;
}
