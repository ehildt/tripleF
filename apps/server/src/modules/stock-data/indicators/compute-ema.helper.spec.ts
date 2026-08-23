import { describe, expect, it } from 'vitest';

import { computeEma } from './compute-ema.helper.js';

describe('computeEma', () => {
  it('seeds with the SMA of the first window, then smooths', () => {
    // period 3, k = 2/4 = 0.5
    expect(computeEma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('returns all null when the series is shorter than the period', () => {
    expect(computeEma([1, 2], 3)).toEqual([null, null]);
  });

  it('converges on a constant series', () => {
    const result = computeEma([10, 10, 10, 10, 10], 3);
    expect(result).toEqual([null, null, 10, 10, 10]);
  });

  it('handles an empty series', () => {
    expect(computeEma([], 3)).toEqual([]);
  });
});
