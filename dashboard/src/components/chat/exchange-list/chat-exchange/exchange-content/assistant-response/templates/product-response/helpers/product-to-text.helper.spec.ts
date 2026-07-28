import { describe, expect, it } from 'vitest';

import { productToText } from './product-to-text.helper';

describe('productToText', () => {
  it('converts product data to readable text', () => {
    const result = productToText({
      category: 'Audio',
      title: 'Sony WH-1000XM5',
      subtitle: 'Wireless headphones',
      shortDescription: 'Flagship noise-cancelling headphones.',
      priceRange: '299–349 EUR',
      aggregateRating: 4.6,
      aggregateRatingCount: 1200,
      aggregateRatingLabel: 'Excellent',
      buyAdvice: 'Best bought on sale.',
      statHighlights: [{ label: 'Battery', value: '30h' }],
      pros: [{ text: 'Top ANC' }],
      cons: [{ text: 'No aptX' }],
      shopOffers: [
        {
          title: 'Amazon',
          price: '319 EUR',
          source: 'amazon.de',
          rating: 4.5,
          link: 'https://amazon.de/offer',
        },
      ],
      reviewSummary: [{ text: 'Praised for comfort' }],
      keyPoints: [{ text: 'LDAC support' }],
      sources: [{ title: 'RTINGS', url: 'https://rtings.com' }],
    });

    expect(result).toContain('Category: Audio');
    expect(result).toContain('Title: Sony WH-1000XM5');
    expect(result).toContain('Flagship noise-cancelling headphones.');
    expect(result).toContain('Price range: 299–349 EUR');
    expect(result).toContain(
      'Aggregate rating: 4.6 (1200 reviews) — Excellent',
    );
    expect(result).toContain('Buy advice: Best bought on sale.');
    expect(result).toContain('Stat highlights: Battery: 30h');
    expect(result).toContain('Pros:');
    expect(result).toContain('- Top ANC');
    expect(result).toContain('Cons:');
    expect(result).toContain('- No aptX');
    expect(result).toContain('Shop offers:');
    expect(result).toContain(
      '- Amazon — 319 EUR — amazon.de — rating 4.5 (https://amazon.de/offer)',
    );
    expect(result).toContain('Review summary:');
    expect(result).toContain('- Praised for comfort');
    expect(result).toContain('Key points:');
    expect(result).toContain('- LDAC support');
    expect(result).toContain('Sources:');
    expect(result).toContain('- RTINGS (https://rtings.com)');
  });

  it('skips shop offers without any label', () => {
    const result = productToText({
      shopOffers: [{ link: 'https://example.com' }],
    });

    expect(result).not.toContain('Shop offers:');
  });

  it('returns empty string for empty data', () => {
    expect(productToText({})).toBe('');
  });
});
