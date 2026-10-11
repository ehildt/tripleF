import { describe, expect, it } from 'vitest';

import { buildGrid } from './build-grid.helper';

describe('buildGrid', () => {
  it('spans the min low to max high across the band count', () => {
    const history = [
      { time: 'a', high: 30, low: 10, volume: 1 },
      { time: 'b', high: 40, low: 20, volume: 1 },
    ];
    expect(buildGrid(history, 3)).toEqual({
      minPrice: 10,
      step: 10,
      bandCount: 3,
    });
  });

  it('uses a non-zero step when the price range is flat', () => {
    const history = [{ time: 'a', high: 10, low: 10, volume: 1 }];
    expect(buildGrid(history, 3).step).toBeCloseTo(1 / 3);
  });
});
