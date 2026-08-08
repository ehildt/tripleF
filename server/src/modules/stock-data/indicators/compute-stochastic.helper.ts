import type { IndicatorSeries, OhlcBar } from './indicators.types.js';

export interface StochasticResult {
  /** %K: close position within the recent high/low range, 0..100. */
  k: IndicatorSeries;
  /** %D: 3-bar SMA of %K. */
  d: IndicatorSeries;
}

/** Stochastic oscillator: %K over `kPeriod` bars, %D as its `dPeriod` SMA. */
export function computeStochastic(
  bars: OhlcBar[],
  kPeriod: number,
  dPeriod = 3,
): StochasticResult {
  const len = bars.length;
  const k: IndicatorSeries = new Array<number | null>(len).fill(null);
  const d: IndicatorSeries = new Array<number | null>(len).fill(null);

  for (let i = kPeriod - 1; i < len; i++) {
    let lowestLow = Infinity;
    let highestHigh = -Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
    }
    const span = highestHigh - lowestLow;
    k[i] = span === 0 ? 50 : ((bars[i].close - lowestLow) / span) * 100;
  }

  for (let i = kPeriod - 1 + dPeriod - 1; i < len; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) sum += k[j] ?? 0;
    d[i] = sum / dPeriod;
  }
  return { k, d };
}
