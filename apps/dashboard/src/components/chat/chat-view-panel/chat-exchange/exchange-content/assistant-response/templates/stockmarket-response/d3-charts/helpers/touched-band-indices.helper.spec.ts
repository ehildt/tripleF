import { describe, expect, it } from 'vitest';

import { touchedBandIndices } from './touched-band-indices.helper';

describe('touchedBandIndices', () => {
  const grid = { minPrice: 0, step: 10, bandCount: 5 };

  it('returns the bands a day range overlaps', () => {
    const day = { time: 't', high: 25, low: 5, volume: 100 };
    expect(touchedBandIndices(day, grid)).toEqual([0, 1, 2]);
  });

  it('returns an empty list when the day sits outside the grid', () => {
    const day = { time: 't', high: 100, low: 90, volume: 100 };
    expect(touchedBandIndices(day, grid)).toEqual([]);
  });
});
