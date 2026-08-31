import { describe, expect, it } from 'vitest';

import { mapPointToHlcPixel } from './map-point-to-hlc-pixel.helper';

describe('mapPointToHlcPixel', () => {
  it('projects a point into HLC pixel geometry', () => {
    const ctx = {
      visibleFrom: 10,
      x: (i: number) => i * 2,
      y: (v: number) => v + 1,
    } as never;
    expect(
      mapPointToHlcPixel(
        { time: 't', open: 1, high: 5, low: 2, close: 4, volume: 0 },
        0,
        ctx,
      ),
    ).toEqual({ x: 20, high: 6, low: 3, close: 5 });
  });
});
