import { describe, expect, it } from 'vitest';

import { rebinnedProfileVolumes } from './rebinned-profile-volumes.helper';

describe('rebinnedProfileVolumes', () => {
  const grid = { minPrice: 0, step: 10, bandCount: 3 };

  it('splits a band across grid cells by overlap share', () => {
    expect(
      rebinnedProfileVolumes([{ low: 5, high: 25, volume: 20 }], grid),
    ).toEqual([5, 10, 5]);
  });

  it('skips zero-width bands', () => {
    expect(
      rebinnedProfileVolumes([{ low: 5, high: 5, volume: 20 }], grid),
    ).toEqual([0, 0, 0]);
  });
});
