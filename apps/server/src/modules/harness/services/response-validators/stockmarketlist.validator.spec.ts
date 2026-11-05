import { describe, expect, it } from 'vitest';

import { validateStockmarketListOutput } from './stockmarketlist.validator.js';

const validPayload = {
  category: 'stocks',
  title: 'Semiconductors',
  subtitle: 'Top movers',
  summary: 'Chip stocks rallied.',
};

describe('validateStockmarketListOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateStockmarketListOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('rejects an empty title', () => {
    const result = validateStockmarketListOutput({
      ...validPayload,
      title: '',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects an item without a ticker', () => {
    const result = validateStockmarketListOutput({
      ...validPayload,
      items: [{ name: 'Nvidia' }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('items');
  });

  it('rejects an item with an empty name', () => {
    expect(
      validateStockmarketListOutput({
        ...validPayload,
        items: [{ name: '', ticker: 'NVDA' }],
      }).valid,
    ).toBe(false);
  });

  it('accepts a list with items', () => {
    const result = validateStockmarketListOutput({
      ...validPayload,
      items: [{ name: 'Nvidia', ticker: 'NVDA', price: 120.5, changeP: 1.26 }],
    });

    expect(result.valid).toBe(true);
  });
});
