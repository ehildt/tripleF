import type { MarketDailyBar } from '../../../market-data.types.js';
import type { EodhdClient } from '../eodhd-client.js';

type EodhdHistoryPoint = Awaited<ReturnType<EodhdClient['history']>>[number];

/** Convert an EODHD history point into the provider-agnostic daily bar. */
export function mapEodhdPointToDailyBar(p: EodhdHistoryPoint): MarketDailyBar {
  return {
    date: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    adjustedClose: p.adjustedClose,
    volume: p.volume,
  };
}
