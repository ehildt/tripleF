import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import {
  addDays,
  utcToday,
} from '../../../../stock-data/helpers/date-range.helper.js';
import {
  computeIndicator,
  type TechnicalFunction,
} from '../../../../stock-data/indicators/compute-indicator.helper.js';
import { MarketHistoryFetchError } from '../../../../stock-data/market-data.types.js';

import { eodhdTechnicalSchema } from './technical.schema.js';

/**
 * Calendar-day lookback for indicator input: about two years of daily bars
 * give every supported function (incl. slow EMA(50) + MACD warmup) enough
 * history, while the streamed series is capped to the last 400 points.
 */
const LOOKBACK_DAYS = 366 * 2;
const MAX_STREAMED_POINTS = 400;

export function createEodhdTechnical(deps: ToolDependencies) {
  return tool({
    description:
      'Compute a technical indicator series (RSI, MACD, ADX, SMA, EMA, BBANDS, ATR, stochastic) for a stock, ETF, or index ticker from locally cached daily bars. Returns the latest value(s) for analysis plus the series as chartData. Use to gauge buy/sell pressure and momentum.',
    inputSchema: eodhdTechnicalSchema,
    execute: async ({ ticker, function: fn, period }) => {
      const getOrFetchHistory = deps.getOrFetchHistory;
      if (!getOrFetchHistory) {
        return {
          summary: { ticker },
          error: 'Market history cache is not available',
        };
      }
      try {
        const to = utcToday();
        const bars = await getOrFetchHistory(
          ticker,
          addDays(to, -LOOKBACK_DAYS),
          to,
        );
        if (bars.length === 0) {
          return { summary: { ticker, function: fn, points: 0 }, results: [] };
        }
        const computed = computeIndicator(
          bars.map((b) => ({
            time: b.date,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
          })),
          fn as TechnicalFunction,
          period,
        );
        const points = computed.points.slice(-MAX_STREAMED_POINTS);
        return {
          summary: {
            ticker,
            function: fn,
            points: points.length,
            ...computed.summary,
          },
          chartData: {
            ticker,
            function: fn,
            technical: points,
          },
        };
      } catch (err) {
        return {
          summary: { ticker },
          error: err instanceof Error ? err.message : String(err),
          rateLimited:
            err instanceof MarketHistoryFetchError ? err.rateLimited : false,
        };
      }
    },
  });
}
