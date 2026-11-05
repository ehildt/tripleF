import { describe, expect, it } from 'vitest';

import { validateProductOutput } from './product.validator.js';

const validPayload = {
  category: 'audio',
  title: 'Sony WH-1000XM5',
  subtitle: 'Headphones',
  shortDescription: 'Noise-cancelling over-ear headphones.',
  heroImageUrl: '',
};

describe('validateProductOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateProductOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('rejects an empty title', () => {
    const result = validateProductOutput({ ...validPayload, title: '' });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects an out-of-range aggregate rating', () => {
    expect(
      validateProductOutput({ ...validPayload, aggregateRating: 6 }).valid,
    ).toBe(false);
  });

  it('rejects a shop offer without a usable link', () => {
    const result = validateProductOutput({
      ...validPayload,
      shopOffers: [{ title: 'Offer', link: 'javascript:alert(1)' }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('shopOffers');
  });

  it('rejects a stat highlight without a value', () => {
    const result = validateProductOutput({
      ...validPayload,
      statHighlights: [{ label: 'Battery' }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('statHighlights');
  });

  it('accepts a fully populated payload', () => {
    const result = validateProductOutput({
      ...validPayload,
      aggregateRating: 4.6,
      aggregateRatingCount: 1200,
      statHighlights: [{ label: 'Battery', value: '30 h' }],
      pros: [{ text: 'Great ANC' }],
      cons: [{ text: 'Pricey' }],
      shopOffers: [
        {
          title: 'MediaMarkt',
          link: 'https://www.mediamarkt.de/x',
          price: '€349',
        },
      ],
    });

    expect(result.valid).toBe(true);
  });
});
