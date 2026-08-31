import { describe, expect, it } from 'vitest';

import { mapEodhdPointToDailyBar } from './map-eodhd-point-to-daily-bar.helper.js';

describe('mapEodhdPointToDailyBar', () => {
  it('converts an EODHD history point into a daily bar', () => {
    expect(
      mapEodhdPointToDailyBar({
        date: '2025-01-01',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        adjustedClose: 104,
        volume: 1000,
      }),
    ).toEqual({
      date: '2025-01-01',
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      adjustedClose: 104,
      volume: 1000,
    });
  });
});
