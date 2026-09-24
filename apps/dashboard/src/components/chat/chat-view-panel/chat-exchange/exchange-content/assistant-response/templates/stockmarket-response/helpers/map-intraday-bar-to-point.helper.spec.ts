import { describe, expect, it } from 'vitest';

import { mapIntradayBarToPoint } from './map-intraday-bar-to-point.helper';

describe('mapIntradayBarToPoint', () => {
  it('maps a raw intraday bar into a chart point', () => {
    expect(
      mapIntradayBarToPoint({
        time: '2025-01-01 10:00:00',
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

  it('defaults a missing volume to zero', () => {
    expect(
      mapIntradayBarToPoint({
        time: '2025-01-01T10:00:00Z',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
      }).volume,
    ).toBe(0);
  });
});
