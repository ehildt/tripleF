import { describe, expect, it } from 'vitest';

import { computeAtr } from './compute-atr.helper.js';
import type { OhlcBar } from './indicators.types.js';

const bars: OhlcBar[] = [
  { time: '2024-01-01', open: 10, high: 12, low: 9, close: 11 },
  { time: '2024-01-02', open: 11, high: 13, low: 10, close: 12 },
  { time: '2024-01-03', open: 12, high: 14, low: 11, close: 13 },
  { time: '2024-01-04', open: 13, high: 15, low: 12, close: 14 },
  { time: '2024-01-05', open: 14, high: 16, low: 13, close: 15 },
];

describe('computeAtr', () => {
  it('returns null until the period fills', () => {
    // TR is 3 for every bar; ATR(3) = 3 from index 3 onward.
    expect(computeAtr(bars, 3)).toEqual([null, null, null, 3, 3]);
  });

  it('returns all null when the series is not longer than the period', () => {
    expect(computeAtr(bars.slice(0, 3), 3)).toEqual([null, null, null]);
  });

  it('handles an empty series', () => {
    expect(computeAtr([], 3)).toEqual([]);
  });
});
