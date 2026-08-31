import type { MarketDailyBar } from '../market-data.types.js';

/** Aggregate one weekly/monthly group into a single daily bar. */
export function mapAggregatedGroup(
  [key, group]: [string, MarketDailyBar[]],
  period: 'w' | 'm',
): MarketDailyBar {
  return {
    date: period === 'm' ? `${key}-01` : group[0].date,
    open: group[0].open,
    high: Math.max(...group.map((b) => b.high)),
    low: Math.min(...group.map((b) => b.low)),
    close: group[group.length - 1].close,
    volume: group.reduce((sum, b) => sum + b.volume, 0),
  };
}
