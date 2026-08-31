import type {
  MarketDailyBar,
  StockHistoryPoint,
} from '../market-data.types.js';

/** Convert a daily bar into the chart-facing point shape. */
export function mapDailyBarToPoint(b: MarketDailyBar): StockHistoryPoint {
  return {
    time: b.date,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  };
}
