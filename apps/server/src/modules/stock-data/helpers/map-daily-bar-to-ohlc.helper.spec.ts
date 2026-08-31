import { describe, expect, it } from 'vitest';

import { mapDailyBarToOhlc } from './map-daily-bar-to-ohlc.helper.js';

describe('mapDailyBarToOhlc', () => {
  it('converts a daily bar into the OHLC shape', () => {
    expect(
      mapDailyBarToOhlc({
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
    });
  });
});
