import { describe, expect, it } from 'vitest';

import { computeStochastic } from './compute-stochastic.helper.js';
import type { OhlcBar } from './indicators.types.js';

const bars: OhlcBar[] = [
  { time: '2024-01-01', open: 10, high: 12, low: 9, close: 11 },
  { time: '2024-01-02', open: 11, high: 13, low: 10, close: 12 },
  { time: '2024-01-03', open: 12, high: 14, low: 11, close: 13 },
  { time: '2024-01-04', open: 13, high: 15, low: 12, close: 14 },
  { time: '2024-01-05', open: 14, high: 16, low: 13, close: 15 },
];

describe('computeStochastic', () => {
  it('computes %K within the recent high/low range', () => {
    const { k } = computeStochastic(bars, 3);
    // Each close sits at 80% of the 3-bar range.
    expect(k).toEqual([null, null, 80, 80, 80]);
  });

  it('computes %D as the SMA of %K', () => {
    const { d } = computeStochastic(bars, 3, 3);
    expect(d).toEqual([null, null, null, null, 80]);
  });

  it('returns 50 when the range span is zero', () => {
    const flat = bars.map((b) => ({ ...b, high: 10, low: 10, close: 10 }));
    const { k } = computeStochastic(flat, 3);
    expect(k[2]).toBe(50);
  });

  it('returns all null when the series is shorter than the period', () => {
    const { k, d } = computeStochastic(bars.slice(0, 2), 3);
    expect(k).toEqual([null, null]);
    expect(d).toEqual([null, null]);
  });
});
