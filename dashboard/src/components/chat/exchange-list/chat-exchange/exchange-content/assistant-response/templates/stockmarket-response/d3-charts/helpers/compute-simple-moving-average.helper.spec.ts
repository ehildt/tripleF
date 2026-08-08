import { describe, expect, it } from 'vitest';

import { computeSimpleMovingAverage } from './compute-simple-moving-average.helper';

describe('computeSimpleMovingAverage', () => {
  it('returns undefined until the window fills', () => {
    const result = computeSimpleMovingAverage([1, 2, 3, 4], 3);
    expect(result.slice(0, 2)).toEqual([undefined, undefined]);
  });

  it('averages the trailing window from the first full bar', () => {
    const result = computeSimpleMovingAverage([1, 2, 3, 4], 3);
    expect(result[2]).toBeCloseTo(2, 5);
    expect(result[3]).toBeCloseTo(3, 5);
  });

  it('matches the manual sum for the final value', () => {
    const values = [10, 20, 30, 40, 50];
    const result = computeSimpleMovingAverage(values, 3);
    expect(result[4]).toBeCloseTo((30 + 40 + 50) / 3, 5);
  });

  it('ignores invalid periods', () => {
    expect(computeSimpleMovingAverage([1, 2], 0)).toEqual([
      undefined,
      undefined,
    ]);
  });
});
