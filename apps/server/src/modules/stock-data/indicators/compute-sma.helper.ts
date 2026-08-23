import type { IndicatorSeries } from './indicators.types.js';

/** Simple moving average over `values`; null until the window fills. */
export function computeSma(values: number[], period: number): IndicatorSeries {
  const result: IndicatorSeries = new Array<number | null>(values.length).fill(
    null,
  );
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) result[i] = sum / period;
  }
  return result;
}
