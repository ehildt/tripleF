/** Aligned series slot: null marks warmup bars without a value yet. */
export type IndicatorSeries = Array<number | null>;

/** One OHLC input bar for indicator math (ascending by time). */
export interface OhlcBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
