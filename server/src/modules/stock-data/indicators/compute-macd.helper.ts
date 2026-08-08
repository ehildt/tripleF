import { computeEma } from './compute-ema.helper.js';
import type { IndicatorSeries } from './indicators.types.js';

export interface MacdResult {
  /** EMA(fast) − EMA(slow) per bar. */
  macd: IndicatorSeries;
  /** EMA(signalPeriod) of the macd line. */
  signal: IndicatorSeries;
  /** macd − signal. */
  histogram: IndicatorSeries;
}

/** MACD (default 12/26/9) over closes. */
export function computeMacd(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MacdResult {
  const fast = computeEma(closes, fastPeriod);
  const slow = computeEma(closes, slowPeriod);

  const macd: IndicatorSeries = closes.map((_, i) =>
    fast[i] !== null && slow[i] !== null ? fast[i]! - slow[i]! : null,
  );

  // Signal is the EMA of the macd line over the window where macd exists.
  const firstMacd = macd.findIndex((v) => v !== null);
  const macdValues = firstMacd < 0 ? [] : (macd.slice(firstMacd) as number[]);
  const signalTail = computeEma(macdValues, signalPeriod);
  const signal: IndicatorSeries = new Array<number | null>(closes.length).fill(
    null,
  );
  for (let i = 0; i < signalTail.length; i++) {
    signal[firstMacd + i] = signalTail[i];
  }

  const histogram: IndicatorSeries = closes.map((_, i) =>
    macd[i] !== null && signal[i] !== null ? macd[i]! - signal[i]! : null,
  );
  return { macd, signal, histogram };
}
