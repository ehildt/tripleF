import { describe, expect, it } from 'vitest';

import { dailyVolumes } from './daily-volumes.helper';

describe('dailyVolumes', () => {
  const grid = { minPrice: 0, step: 10, bandCount: 3 };

  it('spreads a day volume evenly across touched bands', () => {
    const day = { time: 't', high: 25, low: 5, volume: 30 };
    expect(dailyVolumes(day, grid)).toEqual([10, 10, 10]);
  });

  it('returns zeros when the day touches no bands', () => {
    const day = { time: 't', high: 100, low: 90, volume: 30 };
    expect(dailyVolumes(day, grid)).toEqual([0, 0, 0]);
  });
});
