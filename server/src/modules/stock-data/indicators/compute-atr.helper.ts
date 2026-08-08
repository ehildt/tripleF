import type { IndicatorSeries, OhlcBar } from './indicators.types.js';

/**
 * Average True Range with Wilder smoothing. TR per bar is the max of the
 * bar range and its gap to the previous close.
 */
export function computeAtr(bars: OhlcBar[], period: number): IndicatorSeries {
  const result: IndicatorSeries = new Array<number | null>(bars.length).fill(
    null,
  );
  if (bars.length <= period) return result;

  const tr: number[] = [bars[0].high - bars[0].low];
  for (let i = 1; i < bars.length; i++) {
    tr.push(
      Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close),
      ),
    );
  }

  let atr = 0;
  for (let i = 1; i <= period; i++) atr += tr[i];
  atr /= period;
  result[period] = atr;

  for (let i = period + 1; i < bars.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    result[i] = atr;
  }
  return result;
}
