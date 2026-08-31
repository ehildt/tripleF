import type { EodhdIntradayPoint } from '../../../../../stock-data/providers/eodhd/eodhd-client.js';

/** Number of fixed price bands spanning the full intraday price range. */
export const BAND_COUNT = 10;

/** Build one trading day's per-price-band volume profile. */
export function mapDayVolumeProfile(
  [day, dayBars]: [string, EodhdIntradayPoint[]],
  minPrice: number,
  step: number,
) {
  const bands: Array<{ low: number; high: number; volume: number }> = [];
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
}
