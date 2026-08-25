import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import type { EodhdIntradayPoint } from '../../../../stock-data/providers/eodhd/eodhd-client.js';

import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdIntradaySchema } from './intraday.schema.js';

/** Number of fixed price bands spanning the full intraday price range. */
const BAND_COUNT = 10;

export function createEodhdIntraday(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch intraday OHLCV bars for an EODHD ticker and return a per-day, per-price-band volume profile as chartData for the client heatmap. Use to render a volume heatmap across fixed price bands.',
    inputSchema: eodhdIntradaySchema,
    execute: async ({ ticker, interval, days }) => {
      const client = createEodhdClient(deps, 'intraday');
      if (!client) {
        return {
          summary: { ticker },
          error: 'EODHD intraday is not enabled or no API key configured',
        };
      }
      try {
        const count = days ?? 30;
        const to = Math.floor(Date.now() / 1000);
        const from = to - count * 24 * 60 * 60;
        const bars: EodhdIntradayPoint[] = await client.intraday(ticker, {
          interval: interval ?? '5m',
          from,
          to,
        });
        if (bars.length === 0) {
          return { summary: { ticker, points: 0 }, results: [] };
        }

        // Group intraday bars by trading day.
        const byDay = new Map<string, EodhdIntradayPoint[]>();
        for (const bar of bars) {
          const day = bar.time.slice(0, 10);
          const list = byDay.get(day) ?? [];
          list.push(bar);
          byDay.set(day, list);
        }

        // Fixed price bands spanning the full intraday range.
        const minPrice = Math.min(...bars.map((b) => b.low));
        const maxPrice = Math.max(...bars.map((b) => b.high));
        const span = maxPrice - minPrice || 1;
        const step = span / BAND_COUNT;

        const volumeProfile = [...byDay.entries()].map(([day, dayBars]) => {
          const bands: Array<{ low: number; high: number; volume: number }> =
            [];
          for (let i = 0; i < BAND_COUNT; i++) {
            const low = minPrice + i * step;
            const high = minPrice + (i + 1) * step;
            let volume = 0;
            for (const bar of dayBars) {
              if (bar.high > low && bar.low < high) volume += bar.volume ?? 0;
            }
            bands.push({ low, high, volume });
          }
          return { time: day, bands };
        });

        // The most recent trading day's raw bars, for the client's 1D view.
        const lastDayBars = [...byDay.entries()].at(-1)?.[1] ?? [];
        const intradayBars = lastDayBars.map((b) => ({
          time: b.time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
        }));

        return {
          summary: {
            ticker,
            days: byDay.size,
            bars: bars.length,
            interval: interval ?? '5m',
          },
          chartData: {
            ticker,
            interval: interval ?? '5m',
            volumeProfile,
            bars: intradayBars,
          },
        };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
