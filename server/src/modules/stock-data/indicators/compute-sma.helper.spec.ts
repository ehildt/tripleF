import { describe, expect, it } from 'vitest';

import { computeSma } from './compute-sma.helper.js';

describe('computeSma', () => {
  it('returns null until the window fills', () => {
    expect(computeSma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('handles a period equal to the series length', () => {
    expect(computeSma([1, 2, 3], 3)).toEqual([null, null, 2]);
  });

  it('returns all null when the series is shorter than the period', () => {
    expect(computeSma([1, 2], 3)).toEqual([null, null]);
  });

  it('returns the series itself for a period of 1', () => {
    expect(computeSma([5, 7, 9], 1)).toEqual([5, 7, 9]);
  });

  it('handles an empty series', () => {
    expect(computeSma([], 3)).toEqual([]);
  });
});
