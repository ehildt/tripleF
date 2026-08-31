import type { StockMarketBar } from '../../../../generated/prisma/client.js';
import type { MarketDailyBar } from '../../market-data.types.js';

/** Convert a stored bar row into the provider-agnostic daily bar. */
export function mapBarRowToDailyBar(row: StockMarketBar): MarketDailyBar {
  return {
    date: row.date.toISOString().slice(0, 10),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    adjustedClose: row.adjustedClose ?? undefined,
    volume: Number(row.volume),
  };
}
