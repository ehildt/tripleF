import { describe, expect, it } from 'vitest';

import { mapBrightDataNewsResult } from './map-bright-data-news-result.helper.js';

describe('mapBrightDataNewsResult', () => {
  it('maps a news item to the news-search result shape', () => {
    expect(
      mapBrightDataNewsResult({
        title: 'Headline',
        link: 'https://example.com',
        description: 'Summary',
        date: '2025-01-01',
        source: 'Example News',
        image_url: 'https://example.com/img.jpg',
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

  it('falls back to the provider source and empty strings', () => {
    expect(
      mapBrightDataNewsResult({
        title: 'Headline',
        link: 'https://example.com',
        description: '',
        date: '',
        source: '',
      }),
    ).toEqual({
      title: 'Headline',
      snippet: '',
      url: 'https://example.com',
      source: 'brightData',
      date: '',
      imageUrl: '',
    });
  });
});
