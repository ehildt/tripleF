import { describe, expect, it } from 'vitest';

import { mapEodhdIntradayPoint } from './map-eodhd-intraday-point.helper.js';

describe('mapEodhdIntradayPoint', () => {
  it('renames datetime to time and keeps the rest', () => {
    expect(
      mapEodhdIntradayPoint({
        datetime: '2025-01-01T10:00:00Z',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 1000,
      }),
    ).toEqual({
      time: '2025-01-01T10:00:00Z',
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 1000,
    });
  });
});
