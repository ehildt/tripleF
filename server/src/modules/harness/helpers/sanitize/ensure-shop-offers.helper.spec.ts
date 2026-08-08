import { describe, expect, it } from 'vitest';

import type { ExtractedShopOffer } from '../media/extract-shop-offers.types.js';

import { ensureShopOffers } from './ensure-shop-offers.helper.js';

const offer = (title: string, price: string): ExtractedShopOffer => ({
  title,
  price,
  source: 's',
  link: 'https://x.com',
});

describe('ensureShopOffers', () => {
  it('injects offers when missing for a product template', () => {
    const result = ensureShopOffers({ title: 'X' }, 'product', [
      offer('A', '$10'),
    ]);
    expect(result?.shopOffers).toEqual([offer('A', '$10')]);
  });

  it('returns data unchanged when offers are already present', () => {
    const data = { shopOffers: [offer('A', '$10')] };
    const result = ensureShopOffers(data, 'product', [offer('B', '$5')]);
    expect(result).toBe(data);
  });

  it('returns data unchanged for non-shop templates', () => {
    const data = { title: 'X' };
    const result = ensureShopOffers(data, 'article', [offer('A', '$10')]);
    expect(result).toBe(data);
  });

  it('returns data unchanged when no offers are extracted', () => {
    const data = { title: 'X' };
    const result = ensureShopOffers(data, 'product', []);
    expect(result).toBe(data);
  });

  it('sorts offers by price with installments last', () => {
    const result = ensureShopOffers({ title: 'X' }, 'product', [
      offer('Monthly', '$29.12/mo'),
      offer('OneTime', '$50'),
      offer('Cheap', '$10'),
    ]);
    const titles = (result?.shopOffers as ExtractedShopOffer[]).map(
      (o) => o.title,
    );
    expect(titles).toEqual(['Cheap', 'OneTime', 'Monthly']);
  });
});
