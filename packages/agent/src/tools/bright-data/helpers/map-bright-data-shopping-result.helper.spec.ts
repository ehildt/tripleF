import { describe, expect, it } from 'vitest';

import { mapBrightDataShoppingResult } from './map-bright-data-shopping-result.helper.js';

describe('mapBrightDataShoppingResult', () => {
  it('maps a shopping item to the shopping-search result shape', () => {
    expect(
      mapBrightDataShoppingResult({
        title: 'Product',
        link: 'https://example.com/product',
        price: '$10',
        source: 'Example Store',
        image_url: 'https://example.com/img.jpg',
        delivery: 'Free',
        rating: 4.5,
        rating_count: 10,
      }),
    ).toEqual({
      title: 'Product',
      price: '$10',
      link: 'https://example.com/product',
      source: 'Example Store',
      imageUrl: 'https://example.com/img.jpg',
      delivery: 'Free',
      rating: 4.5,
      ratingCount: 10,
    });
  });

  it('falls back to empty strings for optional fields', () => {
    expect(mapBrightDataShoppingResult({})).toEqual({
      title: '',
      price: '',
      link: '',
      source: '',
      imageUrl: '',
      delivery: '',
      rating: undefined,
      ratingCount: undefined,
    });
  });
});
