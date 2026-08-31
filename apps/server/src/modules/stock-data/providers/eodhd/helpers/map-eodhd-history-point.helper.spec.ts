import { describe, expect, it } from 'vitest';

import { mapEodhdHistoryPoint } from './map-eodhd-history-point.helper.js';

describe('mapEodhdHistoryPoint', () => {
  it('renames adjusted_close to adjustedClose and keeps the rest', () => {
    expect(
      mapEodhdHistoryPoint({
        date: '2025-01-01',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        adjusted_close: 104,
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
