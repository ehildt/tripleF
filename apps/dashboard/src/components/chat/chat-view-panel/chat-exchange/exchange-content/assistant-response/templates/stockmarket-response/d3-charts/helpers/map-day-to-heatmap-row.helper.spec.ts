import { describe, expect, it } from 'vitest';

import { mapDayToHeatmapRow } from './map-day-to-heatmap-row.helper';

const grid = { minPrice: 0, step: 1, bandCount: 2 };
const rebinned = () => [1, 2];
const daily = () => [3, 4];

describe('mapDayToHeatmapRow', () => {
  it('uses the profile volumes when a profile exists', () => {
    const profileByDay = new Map([
      ['t', { time: 't', bands: [{ low: 0, high: 1, volume: 5 }] }],
    ]);
    const result = mapDayToHeatmapRow(
      { time: 't', high: 1, low: 0, volume: 10 },
      profileByDay,
      grid,
      rebinned,
      daily,
    );
    expect(result).toEqual({ time: 't', volumes: [1, 2] });
  });

  it('falls back to daily volumes without a profile', () => {
    const result = mapDayToHeatmapRow(
      { time: 't', high: 1, low: 0, volume: 10 },
      new Map(),
      grid,
      rebinned,
      daily,
    );
    expect(result).toEqual({ time: 't', volumes: [3, 4] });
  });
});
