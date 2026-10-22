import { describe, expect, it } from 'vitest';

import { buildShopOffersLines } from './build-shop-offers-lines.helper';

describe('buildShopOffersLines', () => {
  it('returns no lines for no offers', () => {
    expect(buildShopOffersLines(undefined)).toEqual([]);
    expect(buildShopOffersLines([])).toEqual([]);
  });

  it('formats a full offer with rating and link', () => {
    expect(
      buildShopOffersLines([
        {
          title: 'Widget',
          price: '$10',
          source: 'Store',
          rating: 4.5,
          link: 'https://example.com',
        },
      ]),
    ).toEqual([
      'Shop offers:',
      '- Widget — $10 — Store — rating 4.5 (https://example.com)',
    ]);
  });

  it('skips offers with no renderable label', () => {
    expect(buildShopOffersLines([{ rating: 4 }])).toEqual([]);
  });
});
