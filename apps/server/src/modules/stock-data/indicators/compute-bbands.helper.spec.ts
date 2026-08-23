import { describe, expect, it } from 'vitest';

import { computeBollingerBands } from './compute-bbands.helper.js';

describe('computeBollingerBands', () => {
  it('computes middle band as SMA and bands as ±2 stddev', () => {
    const { upper, middle, lower } = computeBollingerBands([1, 2, 3, 4, 5], 3);
    expect(middle).toEqual([null, null, 2, 3, 4]);
    // Population stddev of [1,2,3] is sqrt(2/3) ≈ 0.8165.
    expect(upper[2]).toBeCloseTo(2 + 2 * Math.sqrt(2 / 3));
    expect(lower[2]).toBeCloseTo(2 - 2 * Math.sqrt(2 / 3));
    expect(upper[4]).toBeCloseTo(4 + 2 * Math.sqrt(2 / 3));
    expect(lower[4]).toBeCloseTo(4 - 2 * Math.sqrt(2 / 3));
  });

  it('honors a custom multiplier', () => {
    const { upper, lower } = computeBollingerBands([1, 2, 3], 3, 1);
    expect(upper[2]).toBeCloseTo(2 + Math.sqrt(2 / 3));
    expect(lower[2]).toBeCloseTo(2 - Math.sqrt(2 / 3));
  });

  it('returns null bands when the series is shorter than the period', () => {
    const { upper, middle, lower } = computeBollingerBands([1, 2], 3);
    expect(middle).toEqual([null, null]);
    expect(upper).toEqual([null, null]);
    expect(lower).toEqual([null, null]);
  });
});
