import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import { aggregateDailyBars } from '../../../../stock-data/helpers/aggregate-daily-bars.helper.js';
import { computePriceExtremes } from '../../../../stock-data/helpers/compute-price-extremes.helper.js';
import {
  addDays,
  utcToday,
} from '../../../../stock-data/helpers/date-range.helper.js';
import {
  type MarketDailyBar,
  MarketHistoryFetchError,
} from '../../../../stock-data/market-data.types.js';

import { eodhdHistorySchema } from './history.schema.js';

/** Default history depth when the model does not ask for a length. */
const DEFAULT_POINTS = 66;

/** Map the vendor-free cache error contract to a tool result. */
function historyErrorResult(
  ticker: string,
  err: unknown,
): {
  summary: { ticker: string };
  error: string;
  rateLimited?: boolean;
} {
  return {
    summary: { ticker },
    error: err instanceof Error ? err.message : String(err),
    rateLimited:
      err instanceof MarketHistoryFetchError ? err.rateLimited : false,
  };
}

export function createEodhdHistory(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch end-of-day OHLCV price history for an EODHD ticker. Returns a compact summary for analysis plus the full time series as chartData for the client chart. Read through the local market-history cache: already-stored windows are instant and only gaps hit the provider. Use for the time-value chart and buy/sell pressure (volume) of a stock, ETF, or index.',
    inputSchema: eodhdHistorySchema,
    execute: async ({ ticker, period, points }) => {
      const getOrFetchHistory = deps.getOrFetchHistory;
      if (!getOrFetchHistory) {
        return {
          summary: { ticker },
          error: 'Market history cache is not available',
        };
      }
      try {
        const count = points ?? DEFAULT_POINTS;
        const to = utcToday();
        // Bars are trading days: scale by 7/5 for weekends, plus buffer.
        const windowFrom = Math.ceil(count * 1.4) + 10;
        // The summary extremes span two years so price levels the model
        // annotates (52-week high/low, period highs) come from the actual
        // series — the single source of truth — not from web search.
        const from = addDays(to, -Math.max(windowFrom, 731));
        const daily = await getOrFetchHistory(ticker, from, to);
        const bars: MarketDailyBar[] =
          period && period !== 'd'
            ? aggregateDailyBars(daily, period)
            : daily.slice(-count);
        if (bars.length === 0) {
          return { summary: { ticker, points: 0 }, results: [] };
        }
        const first = bars[0];
        const last = bars[bars.length - 1];
        const changeP =
          first && first.close
            ? ((last.close - first.close) / first.close) * 100
            : undefined;
        const extremes = computePriceExtremes(daily);
        const fiftyTwoWeekSince = addDays(to, -365);
        const fiftyTwoWeek = computePriceExtremes(
          daily.filter((bar) => bar.date >= fiftyTwoWeekSince),
        );
        const chartData = {
          ticker,
          history: bars.map((p) => ({
            time: p.date,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume,
          })),
        };
        return {
          summary: {
            ticker,
            points: bars.length,
            latestClose: last.close,
            changeP,
            period: period ?? 'd',
            historyCoveredFrom: daily[0]?.date,
            historyCoveredTo: daily[daily.length - 1]?.date,
            ...(extremes
              ? {
                  historyHigh: extremes.high.value,
                  historyHighDate: extremes.high.date,
                  historyLow: extremes.low.value,
                  historyLowDate: extremes.low.date,
                }
              : {}),
            ...(fiftyTwoWeek
              ? {
                  fiftyTwoWeekHigh: fiftyTwoWeek.high.value,
                  fiftyTwoWeekHighDate: fiftyTwoWeek.high.date,
                  fiftyTwoWeekLow: fiftyTwoWeek.low.value,
                  fiftyTwoWeekLowDate: fiftyTwoWeek.low.date,
                }
              : {}),
          },
          chartData,
        };
      } catch (err) {
        return historyErrorResult(ticker, err);
      }
    },
  });
}
