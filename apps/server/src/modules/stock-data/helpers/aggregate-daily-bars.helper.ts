import type { MarketDailyBar } from '../market-data.types.js';

import { mapAggregatedGroup } from './map-aggregated-group.helper.js';

/**
 * Aggregate daily bars into weekly or monthly bars (open = first bar, close
 * = last bar, high/low = extremes, volume = sum). Used when a weekly or
 * monthly series is requested — the cache stores daily bars only.
 */
export function aggregateDailyBars(
  bars: MarketDailyBar[],
  period: 'w' | 'm',
): MarketDailyBar[] {
  const groups = new Map<string, MarketDailyBar[]>();
  for (const bar of bars) {
    const key = period === 'm' ? bar.date.slice(0, 7) : isoWeekKey(bar.date);
    const group = groups.get(key) ?? [];
    group.push(bar);
    groups.set(key, group);
  }

  return [...groups.entries()].map((entry) =>
    mapAggregatedGroup(entry, period),
  );
}

/** ISO week key (YYYY-Www) for a YYYY-MM-DD date. */
function isoWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
