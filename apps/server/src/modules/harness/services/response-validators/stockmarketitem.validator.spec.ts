import { describe, expect, it } from 'vitest';

import { validateStockmarketItemOutput } from './stockmarketitem.validator.js';

const validPayload = {
  category: 'stocks',
  title: 'Nvidia',
  subtitle: 'NVDA',
  shortDescription: 'Semiconductor maker.',
};

describe('validateStockmarketItemOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateStockmarketItemOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('rejects an empty title', () => {
    const result = validateStockmarketItemOutput({
      ...validPayload,
      title: '',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects a news entry without a url', () => {
    const result = validateStockmarketItemOutput({
      ...validPayload,
      news: [{ title: 'Earnings beat' }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('news');
  });

  it('rejects a news entry with an untrusted url', () => {
    expect(
      validateStockmarketItemOutput({
        ...validPayload,
        news: [{ title: 'Earnings beat', url: 'javascript:alert(1)' }],
      }).valid,
    ).toBe(false);
  });

  it('accepts a fully populated payload', () => {
    const result = validateStockmarketItemOutput({
      ...validPayload,
      currentPrice: 120.5,
      change: 1.5,
      changeP: 1.26,
      recommendation: 'buy',
      fundamentals: { sector: 'Technology', peRatio: '55' },
      news: [{ title: 'Earnings beat', url: 'https://example.com/n' }],
      referenceLines: [],
      markers: [],
    });

    expect(result.valid).toBe(true);
  });
});
