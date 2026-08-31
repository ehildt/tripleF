import type { OhlcBar } from '../indicators/indicators.types.js';
import type { MarketDailyBar } from '../market-data.types.js';

/** Convert a daily bar into the OHLC shape indicator math expects. */
export function mapDailyBarToOhlc(b: MarketDailyBar): OhlcBar {
  return {
    time: b.date,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  };
}
