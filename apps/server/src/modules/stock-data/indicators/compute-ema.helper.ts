import type { IndicatorSeries } from './indicators.types.js';

/**
 * Exponential moving average over `values`. Seeded by the SMA at the end of
 * the first window (standard seeding); null before it.
 */
export function computeEma(values: number[], period: number): IndicatorSeries {
  const result: IndicatorSeries = new Array<number | null>(values.length).fill(
    null,
  );
  if (values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  result[period - 1] = ema;

  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}
