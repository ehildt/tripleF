import { describe, expect, it, vi } from 'vitest';

import { resolveOfferMerchantUrl } from './resolve-offer-merchant-url.helper.js';

vi.mock('./fetch-with-timeout.js', () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from './fetch-with-timeout.js';

const mockFetchWithTimeout = vi.mocked(fetchWithTimeout);

describe('resolveOfferMerchantUrl', () => {
  it('pairs an offer with its resolved merchant url', async () => {
    mockFetchWithTimeout.mockResolvedValue(
      new Response(JSON.stringify({ organic: [{ link: 'https://merchant.com/product' }] }), { status: 200 }),
    );
    const result = await resolveOfferMerchantUrl(
      { title: 'Product', link: 'https://google.com/search', source: 'Merchant' },
      { apiKey: 'k' },
    );
    expect(result).toEqual({
      offer: {
        title: 'Product',
        link: 'https://google.com/search',
        source: 'Merchant',
      },
      merchantUrl: 'https://merchant.com/product',
    });
  });

  it('returns an undefined merchant url when no organic result matches', async () => {
    mockFetchWithTimeout.mockResolvedValue(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    const result = await resolveOfferMerchantUrl(
      { title: 'Product', link: 'https://google.com/search', source: 'Merchant' },
      { apiKey: 'k' },
    );
    expect(result.merchantUrl).toBeUndefined();
  });
});
