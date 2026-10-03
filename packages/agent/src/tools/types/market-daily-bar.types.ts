/** A single end-of-day OHLCV bar, provider-agnostic. */
export interface MarketDailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
}
