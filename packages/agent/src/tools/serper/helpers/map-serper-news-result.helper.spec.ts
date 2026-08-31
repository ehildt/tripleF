import { describe, expect, it } from 'vitest';

import { mapSerperNewsResult } from './map-serper-news-result.helper.js';

describe('mapSerperNewsResult', () => {
  it('maps a news item to the news-search result shape', () => {
    expect(
      mapSerperNewsResult({
        title: 'Headline',
        link: 'https://example.com',
        snippet: 'Summary',
        date: '2025-01-01',
        source: 'Example News',
        imageUrl: 'https://example.com/img.jpg',
      }),
    ).toEqual({
      title: 'Headline',
      snippet: 'Summary',
      url: 'https://example.com',
      source: 'Example News',
      date: '2025-01-01',
      imageUrl: 'https://example.com/img.jpg',
    });
  });

  it('falls back to empty strings for optional fields', () => {
    expect(
      mapSerperNewsResult({
        title: 'Headline',
        link: 'https://example.com',
        snippet: '',
        date: '',
        source: '',
      }),
    ).toEqual({
      title: 'Headline',
      snippet: '',
      url: 'https://example.com',
      source: '',
      date: '',
      imageUrl: '',
    });
  });
});
