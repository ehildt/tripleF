/**
 * Simple moving average aligned to the input: the value at index `i` is the
 * mean of the `period` values ending there; the first `period - 1` slots are
 * `undefined`. Ported from the lightweight-charts MA overlay so the D3 chart
 * draws the same line.
 */
export function computeSimpleMovingAverage(
  values: number[],
  period: number,
): Array<number | undefined> {
  const result: Array<number | undefined> = new Array(values.length);
  if (period < 1) return result;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) result[i] = sum / period;
  }
  return result;
}
