import { describe, expect, it } from 'vitest';

import { mapIntradayBar } from './map-intraday-bar.helper.js';

describe('mapIntradayBar', () => {
  it('copies an intraday bar into the chart-facing shape', () => {
    expect(
      mapIntradayBar({
        time: '2025-01-01T10:00:00Z',
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
