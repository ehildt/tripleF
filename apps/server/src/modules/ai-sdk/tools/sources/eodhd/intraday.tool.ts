import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import type { EodhdIntradayPoint } from '../../../../stock-data/providers/eodhd/eodhd-client.js';

import {
  BAND_COUNT,
  mapDayVolumeProfile,
} from './helpers/map-day-volume-profile.helper.js';
import { mapIntradayBar } from './helpers/map-intraday-bar.helper.js';
import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdIntradaySchema } from './intraday.schema.js';

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

        const volumeProfile = [...byDay.entries()].map((entry) =>
          mapDayVolumeProfile(entry, minPrice, step),
        );

        // The most recent trading day's raw bars, for the client's 1D view.
        const lastDayBars = [...byDay.entries()].at(-1)?.[1] ?? [];
        const intradayBars = lastDayBars.map(mapIntradayBar);

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
