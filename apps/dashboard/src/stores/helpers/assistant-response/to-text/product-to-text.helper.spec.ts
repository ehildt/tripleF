import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { productToText } from './product-to-text.helper';

describe('productToText', () => {
  it('formats the aggregate rating with count and label', () => {
    const data: AssistantResponseData = {
      aggregateRating: 4.6,
      aggregateRatingCount: 12840,
      aggregateRatingLabel: 'Excellent',
    };
    expect(productToText(data)).toContain(
      'Aggregate rating: 4.6 (12840 reviews) — Excellent',
    );
  });

  it('renders stat highlights as a joined list', () => {
    const data: AssistantResponseData = {
      statHighlights: [
        { label: 'Screen', value: '6"' },
        { label: 'Battery', value: '2 days' },
      ],
    };
    expect(productToText(data)).toContain(
      'Stat highlights: Screen: 6", Battery: 2 days',
    );
  });

  it('renders pros, cons, offers, and sources', () => {
    const data: AssistantResponseData = {
      pros: [{ text: 'fast' }],
      cons: [{ text: 'heavy' }],
      shopOffers: [{ title: 'Widget', price: '$10', link: 'https://a' }],
      sources: [{ title: 'Src', url: 'https://b' }],
    };
    const text = productToText(data);
    expect(text).toContain('Pros:');
    expect(text).toContain('Cons:');
    expect(text).toContain('Shop offers:');
    expect(text).toContain('Sources:');
  });
});
