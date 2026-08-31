import { describe, expect, it } from 'vitest';

import { mapMarkerLayoutToPrice } from './map-marker-layout-to-price.helper';

describe('mapMarkerLayoutToPrice', () => {
  it('projects index and price', () => {
    expect(
      mapMarkerLayoutToPrice({
        index: 3,
        price: 10,
        symbol: 'circle',
        color: undefined,
        text: null,
        textAbove: true,
      }),
    ).toEqual({ index: 3, price: 10 });
  });
});
