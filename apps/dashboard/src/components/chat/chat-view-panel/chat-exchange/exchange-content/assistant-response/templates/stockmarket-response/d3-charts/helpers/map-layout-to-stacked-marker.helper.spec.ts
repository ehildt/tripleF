import { describe, expect, it } from 'vitest';

import { mapLayoutToStackedMarker } from './map-layout-to-stacked-marker.helper';

describe('mapLayoutToStackedMarker', () => {
  it('projects a stacked marker with its text shift', () => {
    const ctx = { y: (v: number) => v } as never;
    const result = mapLayoutToStackedMarker(
      {
        index: 0,
        price: 10,
        symbol: 'circle',
        color: undefined,
        text: 'Buy @ 10',
        textAbove: true,
        stackOffset: 2,
      },
      ctx,
      [],
    );
    expect(result.layout.price).toBe(10);
    expect(result.split).toEqual({ price: '10', word: 'Buy' });
    expect(result.textShift).toBeCloseTo(0);
  });
});
