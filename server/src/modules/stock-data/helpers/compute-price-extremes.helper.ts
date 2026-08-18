import type { MarketDailyBar } from '../market-data.types.js';

/** One extreme price with the trading day it occurred on. */
interface PriceExtreme {
  value: number;
  date: string;
}

/** The highest high and lowest low over a bar window. */
interface PriceExtremes {
  high: PriceExtreme;
  low: PriceExtreme;
}

/**
 * Compute the highest high and lowest low over a bar window, with the trading
 * day each occurred on. Returns null for an empty window. These extremes
 * ground the model's chart annotations (52-week high/low, period highs) in
 * the actual series instead of web-searched values.
 */
export function computePriceExtremes(
  bars: MarketDailyBar[],
): PriceExtremes | null {
  let high: PriceExtreme | null = null;
  let low: PriceExtreme | null = null;
  for (const bar of bars) {
    if (!high || bar.high > high.value) {
      high = { value: bar.high, date: bar.date };
    }
    if (!low || bar.low < low.value) {
      low = { value: bar.low, date: bar.date };
    }
  }
  return high && low ? { high, low } : null;
}
