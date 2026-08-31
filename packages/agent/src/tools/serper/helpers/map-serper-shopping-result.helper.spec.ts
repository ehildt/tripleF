import { describe, expect, it } from 'vitest';

import { mapSerperShoppingResult } from './map-serper-shopping-result.helper.js';

describe('mapSerperShoppingResult', () => {
  it('maps a shopping item to the shopping-search result shape', () => {
    expect(
      mapSerperShoppingResult({
        title: 'Product',
        link: 'https://example.com/product',
        price: '$10',
        source: 'Example Store',
        imageUrl: 'https://example.com/img.jpg',
        delivery: 'Free',
        rating: 4.5,
        ratingCount: 10,
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
    expect(
      mapSerperShoppingResult({
        title: 'Product',
        link: '',
        price: '',
        source: '',
      }),
    ).toEqual({
      title: 'Product',
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
