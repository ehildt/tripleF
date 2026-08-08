import { describe, expect, it } from 'vitest';

import { extractShopOffers } from './extract-shop-offers.helper.js';

const tool = (toolName: string, results: unknown[]) => ({
  toolName,
  result: { results },
});

describe('extractShopOffers', () => {
  it('extracts offers from ShoppingSearch results', () => {
    const result = extractShopOffers([
      tool('serperShoppingSearch', [
        { title: 'Phone', price: '$10', source: 'S', link: 'https://x.com' },
      ]),
    ]);
    expect(result).toEqual([
      { title: 'Phone', price: '$10', source: 'S', link: 'https://x.com' },
    ]);
  });

  it('ignores non-shopping tools', () => {
    const result = extractShopOffers([
      tool('serperWebSearch', [{ title: 'Phone', link: 'https://x.com' }]),
    ]);
    expect(result).toEqual([]);
  });

  it('dedupes by link', () => {
    const result = extractShopOffers([
      tool('serperShoppingSearch', [
        { title: 'A', link: 'https://x.com' },
        { title: 'B', link: 'https://x.com' },
      ]),
    ]);
    expect(result).toHaveLength(1);
  });

  it('drops offers without a link', () => {
    const result = extractShopOffers([
      tool('serperShoppingSearch', [{ title: 'A' }]),
    ]);
    expect(result).toEqual([]);
  });
});
