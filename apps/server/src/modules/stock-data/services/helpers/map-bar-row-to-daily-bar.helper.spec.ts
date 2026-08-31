import { describe, expect, it } from 'vitest';

import { mapBarRowToDailyBar } from './map-bar-row-to-daily-bar.helper.js';

describe('mapBarRowToDailyBar', () => {
  it('converts a stored bar row into a daily bar', () => {
    expect(
      mapBarRowToDailyBar({
        ticker: 'AAPL',
        date: new Date('2025-01-01T00:00:00Z'),
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        adjustedClose: 104,
        volume: 1000n,
        fetchedAt: new Date('2025-01-02T00:00:00Z'),
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

  it('drops a null adjustedClose', () => {
    expect(
      mapBarRowToDailyBar({
        ticker: 'AAPL',
        date: new Date('2025-01-01T00:00:00Z'),
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        adjustedClose: null,
        volume: 1000n,
        fetchedAt: new Date('2025-01-02T00:00:00Z'),
      }).adjustedClose,
    ).toBeUndefined();
  });
});
