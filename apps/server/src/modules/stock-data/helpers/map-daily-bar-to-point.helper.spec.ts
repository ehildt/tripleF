import { describe, expect, it } from 'vitest';

import { mapDailyBarToPoint } from './map-daily-bar-to-point.helper.js';

describe('mapDailyBarToPoint', () => {
  it('converts a daily bar into a chart point', () => {
    expect(
      mapDailyBarToPoint({
        date: '2025-01-01',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 1000,
      }),
    ).toEqual({
      time: '2025-01-01',
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 1000,
    });
  });
});
