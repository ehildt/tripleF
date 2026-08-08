import { describe, expect, it } from 'vitest';

import { computeRsi } from './compute-rsi.helper.js';

describe('computeRsi', () => {
  it('returns 100 when there are no losses', () => {
    // All deltas positive → avgLoss 0 → RSI 100.
    expect(computeRsi([1, 2, 3, 4, 5], 3)).toEqual([
      null,
      null,
      null,
      100,
      100,
    ]);
  });

  it('returns 0 when there are no gains', () => {
    // All deltas negative → avgGain 0 → RSI 0.
    expect(computeRsi([5, 4, 3, 2, 1], 3)).toEqual([null, null, null, 0, 0]);
  });

  it('returns 50 for a flat series', () => {
    // No gains and no losses → avgLoss 0 → RSI 100 (per the guard).
    expect(computeRsi([10, 10, 10, 10, 10], 3)).toEqual([
      null,
      null,
      null,
      100,
      100,
    ]);
  });

  it('returns all null when the series is not longer than the period', () => {
    expect(computeRsi([1, 2, 3], 3)).toEqual([null, null, null]);
  });

  it('computes a mixed up/down series', () => {
    // deltas: +1, -1, +1, -1 → avgGain 2/3, avgLoss 1/3 → RSI 66.67.
    const result = computeRsi([1, 2, 1, 2, 1], 3);
    expect(result[3]).toBeCloseTo(66.67, 1);
    // Next delta -1 → avgGain 4/9, avgLoss 5/9 → RSI 44.44.
    expect(result[4]).toBeCloseTo(44.44, 1);
  });
});
