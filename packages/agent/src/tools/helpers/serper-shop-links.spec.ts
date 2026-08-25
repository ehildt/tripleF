import { describe, expect, it, vi } from 'vitest';

import { resolveSerperShopOfferLinks } from './serper-shop-links.js';

vi.mock('./fetch-with-timeout.js', () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from './fetch-with-timeout.js';

const mockFetchWithTimeout = vi.mocked(fetchWithTimeout);
const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as never;

const googleLink = 'https://www.google.com/search?ibp=oshop';

describe('resolveSerperShopOfferLinks', () => {
  it('returns offers unchanged when none are google-linked', async () => {
    const offers = [{ title: 'A', link: 'https://merchant.com/a', source: 'Merchant' }];
    const result = await resolveSerperShopOfferLinks(offers, {
      apiKey: 'k',
      logger,
    });
    expect(result).toEqual(offers);
    expect(mockFetchWithTimeout).not.toHaveBeenCalled();
  });

  it('resolves a google-linked offer to a merchant url', async () => {
    mockFetchWithTimeout.mockResolvedValue(
      new Response(JSON.stringify({ organic: [{ link: 'https://merchant.com/product' }] }), { status: 200 }),
    );
    const offers = [{ title: 'Product', link: googleLink, source: 'Merchant' }];
    const result = await resolveSerperShopOfferLinks(offers, {
      apiKey: 'k',
      logger,
    });
    expect(result[0].link).toBe('https://merchant.com/product');
  });

  it('keeps the original link when resolution fails', async () => {
    mockFetchWithTimeout.mockResolvedValue(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    const offers = [{ title: 'Product', link: googleLink, source: 'Merchant' }];
    const result = await resolveSerperShopOfferLinks(offers, {
      apiKey: 'k',
      logger,
    });
    expect(result[0].link).toBe(googleLink);
  });
});
