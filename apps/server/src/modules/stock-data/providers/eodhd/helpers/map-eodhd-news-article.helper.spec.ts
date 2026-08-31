import { describe, expect, it } from 'vitest';

import { mapEodhdNewsArticle } from './map-eodhd-news-article.helper.js';

describe('mapEodhdNewsArticle', () => {
  it('maps a news article to the domain shape', () => {
    expect(
      mapEodhdNewsArticle({
        title: 'Headline',
        link: 'https://example.com',
        date: '2025-01-01',
        content: 'Body',
        symbols: ['AAPL'],
        tags: ['tech'],
      }),
    ).toEqual({
      title: 'Headline',
      link: 'https://example.com',
      date: '2025-01-01',
      content: 'Body',
      symbols: ['AAPL'],
      tags: ['tech'],
    });
  });
});
