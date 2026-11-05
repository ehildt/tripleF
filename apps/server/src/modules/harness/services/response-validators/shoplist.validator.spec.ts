import { describe, expect, it } from 'vitest';

import { validateShoplistOutput } from './shoplist.validator.js';

const validPayload = {
  category: 'audio',
  title: 'Sony WH-1000XM5',
  subtitle: 'Price comparison',
};

describe('validateShoplistOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateShoplistOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('accepts a payload without offers', () => {
    expect(validateShoplistOutput(validPayload).valid).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = validateShoplistOutput({ ...validPayload, title: '' });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects an offer without a usable link', () => {
    const result = validateShoplistOutput({
      ...validPayload,
      shopOffers: [{ title: 'Offer', link: 'data:text/html,<script>' }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('shopOffers');
  });

  it('rejects an offer with an untrusted image url', () => {
    const result = validateShoplistOutput({
      ...validPayload,
      shopOffers: [
        {
          link: 'https://www.mediamarkt.de/x',
          imageUrl: 'javascript:alert(1)',
        },
      ],
    });

    expect(result.valid).toBe(false);
  });

  it('accepts offers with merchant links', () => {
    const result = validateShoplistOutput({
      ...validPayload,
      shopOffers: [
        {
          title: 'MediaMarkt',
          price: '€349',
          link: 'https://www.mediamarkt.de/x',
          imageUrl: '',
        },
      ],
    });

    expect(result.valid).toBe(true);
  });
});
