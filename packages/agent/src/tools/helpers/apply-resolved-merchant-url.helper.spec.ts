import { describe, expect, it } from 'vitest';

import { applyResolvedMerchantUrl } from './apply-resolved-merchant-url.helper.js';

describe('applyResolvedMerchantUrl', () => {
  it('replaces the link when a merchant url is resolved', () => {
    const offer = {
      title: 'Product',
      link: 'https://google.com/search',
      source: 'Merchant',
    };
    expect(
      applyResolvedMerchantUrl(offer, new Map([['https://google.com/search', 'https://merchant.com/product']])),
    ).toEqual({
      title: 'Product',
      link: 'https://merchant.com/product',
      source: 'Merchant',
    });
  });

  it('keeps the offer unchanged when no merchant url is resolved', () => {
    const offer = {
      title: 'Product',
      link: 'https://google.com/search',
      source: 'Merchant',
    };
    expect(applyResolvedMerchantUrl(offer, new Map())).toBe(offer);
  });
});
