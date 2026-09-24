import { describe, expect, it } from 'vitest';

import { computeRangeExtremes } from './compute-range-extremes.helper';

const points = Array.from({ length: 10 }, (_, i) => ({
  time: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
  high: 100 + i * 10,
  low: 95 + i * 10,
}));

describe('computeRangeExtremes', () => {
  it('finds the high and low over the full slice', () => {
    expect(computeRangeExtremes(points, 0, 10)).toEqual({
      high: { index: 9, price: 190 },
      low: { index: 0, price: 95 },
    });
  });

  it('finds the high and low over a sub-slice', () => {
    // Bars 4..8: high at index 8, low at index 4.
    expect(computeRangeExtremes(points, 4, 9)).toEqual({
      high: { index: 8, price: 180 },
      low: { index: 4, price: 135 },
    });
  });

  it('clamps out-of-bounds indices', () => {
    expect(computeRangeExtremes(points, -5, 100)).toEqual({
      high: { index: 9, price: 190 },
      low: { index: 0, price: 95 },
    });
  });

  it('returns null for empty or degenerate slices', () => {
    expect(computeRangeExtremes([], 0, 10)).toBeNull();
    expect(computeRangeExtremes(points, 5, 5)).toBeNull();
    expect(computeRangeExtremes(points, 8, 3)).toBeNull();
  });
});
