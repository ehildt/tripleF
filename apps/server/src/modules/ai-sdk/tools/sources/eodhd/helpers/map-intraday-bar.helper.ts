import type { EodhdIntradayPoint } from '../../../../../stock-data/providers/eodhd/eodhd-client.js';

/** Copy an intraday bar into the chart-facing bar shape. */
export function mapIntradayBar(b: EodhdIntradayPoint) {
  return {
    time: b.time,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  };
}
