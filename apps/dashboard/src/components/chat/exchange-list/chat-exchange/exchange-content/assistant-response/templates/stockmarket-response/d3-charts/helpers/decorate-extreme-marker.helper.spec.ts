import { describe, expect, it } from 'vitest';

import { decorateExtremeMarker } from './decorate-extreme-marker.helper';

describe('decorateExtremeMarker', () => {
  const extremes = {
    high: { index: 1, price: 200 },
    low: { index: 2, price: 50 },
  };
  const formatPrice = (p: number) => `$${p}`;

  it('decorates the high marker', () => {
    expect(
      decorateExtremeMarker(
        {
          index: 1,
          price: 200,
          symbol: 'arrowUp',
          text: null,
          textAbove: false,
        },
        extremes,
        '1Y',
        { high: 'red', low: 'blue' },
        formatPrice,
      ),
    ).toMatchObject({
      symbol: 'circle',
      color: 'red',
      price: 200,
      text: '1Y HIGH @ $200',
      textAbove: true,
    });
  });

  it('returns a non-extreme marker unchanged', () => {
    const layout = {
      index: 5,
      price: 100,
      symbol: 'arrowUp',
      text: null,
      textAbove: false,
    };
    expect(
      decorateExtremeMarker(
        layout,
        extremes,
        '1Y',
        { high: 'red', low: 'blue' },
        formatPrice,
      ),
    ).toBe(layout);
  });
});
