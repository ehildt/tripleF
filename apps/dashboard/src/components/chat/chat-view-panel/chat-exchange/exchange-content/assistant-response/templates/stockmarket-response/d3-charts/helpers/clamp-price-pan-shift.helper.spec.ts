import { describe, expect, it } from 'vitest';

import { clampPricePanShift } from './clamp-price-pan-shift.helper';

describe('clampPricePanShift', () => {
  it('converts a small pixel pan to a price shift', () => {
    // A 100px band spanning a 100-unit price range: 10px → 10 price units.
    expect(clampPricePanShift(10, 100, 100, 0)).toBeCloseTo(10);
  });

  it('caps the shift at 90% of the price span', () => {
    expect(clampPricePanShift(1000, 100, 100, 0)).toBeCloseTo(90);
  });

  it('respects the zero floor at low prices', () => {
    // A floor of 10 means the domain can shift down at most 10 units.
    expect(clampPricePanShift(-1000, 100, 100, 10)).toBeCloseTo(-10);
  });
});
