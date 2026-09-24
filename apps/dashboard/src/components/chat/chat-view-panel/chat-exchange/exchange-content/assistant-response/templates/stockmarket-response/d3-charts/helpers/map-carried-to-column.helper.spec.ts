import { describe, expect, it } from 'vitest';

import { mapCarriedToColumn } from './map-carried-to-column.helper';

describe('mapCarriedToColumn', () => {
  it('builds a smoothed flow column', () => {
    const stats = [{ total: 10, centroid: 100, spread: 5 }];
    const result = mapCarriedToColumn(
      undefined,
      0,
      stats,
      stats[0],
      1,
      1,
      stats,
      10,
    );
    expect(result).toEqual({ centroid: 100, halfWidth: 5, intensity: 1 });
  });
});
