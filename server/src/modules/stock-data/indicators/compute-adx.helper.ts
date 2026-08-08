import type { IndicatorSeries, OhlcBar } from './indicators.types.js';

export interface AdxResult {
  adx: IndicatorSeries;
  plusDi: IndicatorSeries;
  minusDi: IndicatorSeries;
}

interface DirectionalMovement {
  plusDm: number[];
  minusDm: number[];
  tr: number[];
}

/** Per-bar +DM/−DM and true range (index 0 carries zeros). */
function buildDirectionalMovement(bars: OhlcBar[]): DirectionalMovement {
  const plusDm = [0];
  const minusDm = [0];
  const tr = [0];
  for (let i = 1; i < bars.length; i++) {
    const upMove = bars[i].high - bars[i - 1].high;
    const downMove = bars[i - 1].low - bars[i].low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(
      Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close),
      ),
    );
  }
  return { plusDm, minusDm, tr };
}

/** Wilder-smoothed running totals; index i holds the smoothing state. */
function smoothWilderSeries(values: number[], period: number): number[] {
  const smoothed = new Array<number>(values.length).fill(0);
  let sum = 0;
  for (let i = 1; i <= period && i < values.length; i++) sum += values[i];
  smoothed[period] = sum;
  for (let i = period + 1; i < values.length; i++) {
    sum = sum - sum / period + values[i];
    smoothed[i] = sum;
  }
  return smoothed;
}

/** Smoothed DX series; index aligned with bars, 0 during warmup. */
function buildDxSeries(
  trSmooth: number[],
  plusSmooth: number[],
  minusSmooth: number[],
  period: number,
  len: number,
  plusDi: IndicatorSeries,
  minusDi: IndicatorSeries,
): number[] {
  const dx = new Array<number>(len).fill(0);
  for (let i = period; i < len; i++) {
    const pDi = trSmooth[i] === 0 ? 0 : (100 * plusSmooth[i]) / trSmooth[i];
    const mDi = trSmooth[i] === 0 ? 0 : (100 * minusSmooth[i]) / trSmooth[i];
    plusDi[i] = pDi;
    minusDi[i] = mDi;
    dx[i] = pDi + mDi === 0 ? 0 : (100 * Math.abs(pDi - mDi)) / (pDi + mDi);
  }
  return dx;
}

/**
 * Average Directional Index with Wilder smoothing: +DM/−DM and TR are
 * smoothed over the period, their ratio gives DX, and ADX is the smoothed
 * DX. Null until enough bars accumulated (2 × period).
 */
export function computeAdx(bars: OhlcBar[], period: number): AdxResult {
  const len = bars.length;
  const adx: IndicatorSeries = new Array<number | null>(len).fill(null);
  const plusDi: IndicatorSeries = new Array<number | null>(len).fill(null);
  const minusDi: IndicatorSeries = new Array<number | null>(len).fill(null);
  if (len <= period * 2) return { adx, plusDi, minusDi };

  const dm = buildDirectionalMovement(bars);
  const trSmooth = smoothWilderSeries(dm.tr, period);
  const plusSmooth = smoothWilderSeries(dm.plusDm, period);
  const minusSmooth = smoothWilderSeries(dm.minusDm, period);
  const dx = buildDxSeries(
    trSmooth,
    plusSmooth,
    minusSmooth,
    period,
    len,
    plusDi,
    minusDi,
  );

  let adxValue = 0;
  for (let i = period; i < period * 2; i++) adxValue += dx[i];
  adxValue /= period;
  adx[period * 2 - 1] = adxValue;
  for (let i = period * 2; i < len; i++) {
    adxValue = (adxValue * (period - 1) + dx[i]) / period;
    adx[i] = adxValue;
  }
  return { adx, plusDi, minusDi };
}
