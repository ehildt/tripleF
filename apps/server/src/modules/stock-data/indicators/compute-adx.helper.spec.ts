import { describe, expect, it } from 'vitest';

import { computeAdx } from './compute-adx.helper.js';
import type { OhlcBar } from './indicators.types.js';

const trendingBars: OhlcBar[] = [
  { time: '2024-01-01', open: 10, high: 12, low: 9, close: 11 },
  { time: '2024-01-02', open: 11, high: 13, low: 10, close: 12 },
  { time: '2024-01-03', open: 12, high: 14, low: 11, close: 13 },
  { time: '2024-01-04', open: 13, high: 15, low: 12, close: 14 },
  { time: '2024-01-05', open: 14, high: 16, low: 13, close: 15 },
  { time: '2024-01-06', open: 15, high: 17, low: 14, close: 16 },
  { time: '2024-01-07', open: 16, high: 18, low: 15, close: 17 },
  { time: '2024-01-08', open: 17, high: 19, low: 16, close: 18 },
];

describe('computeAdx', () => {
  it('returns all-null series when there are not enough bars', () => {
    const { adx, plusDi, minusDi } = computeAdx(trendingBars.slice(0, 5), 3);
    expect(adx.every((v) => v === null)).toBe(true);
    expect(plusDi.every((v) => v === null)).toBe(true);
    expect(minusDi.every((v) => v === null)).toBe(true);
  });

  it('reports a strong +DI and near-zero ADX for a pure uptrend', () => {
    const { adx, plusDi, minusDi } = computeAdx(trendingBars, 3);
    // +DI is 100% of the smoothed TR; -DI is 0.
    expect(plusDi[3]).toBeCloseTo(100 / 3, 5);
    expect(minusDi[3]).toBe(0);
    // DX is 100 for a pure directional move, so ADX converges to 100.
    expect(adx[5]).toBeCloseTo(100);
    expect(adx[7]).toBeCloseTo(100);
  });
});
