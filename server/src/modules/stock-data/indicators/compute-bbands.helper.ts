import { computeSma } from './compute-sma.helper.js';
import type { IndicatorSeries } from './indicators.types.js';

export interface BollingerResult {
  upper: IndicatorSeries;
  middle: IndicatorSeries;
  lower: IndicatorSeries;
}

/** Bollinger Bands: SMA(period) ± 2 × population stddev over closes. */
export function computeBollingerBands(
  closes: number[],
  period: number,
  multiplier = 2,
): BollingerResult {
  const middle = computeSma(closes, period);
  const upper: IndicatorSeries = new Array<number | null>(closes.length).fill(
    null,
  );
  const lower: IndicatorSeries = new Array<number | null>(closes.length).fill(
    null,
  );

  for (let i = period - 1; i < closes.length; i++) {
    const mean = middle[i];
    if (mean === null) continue;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += (closes[j] - mean) ** 2;
    }
    const stddev = Math.sqrt(variance / period);
    upper[i] = mean + multiplier * stddev;
    lower[i] = mean - multiplier * stddev;
  }
  return { upper, middle, lower };
}
