import { describe, expect, it } from 'vitest';

import { mapArticleToSearchResult } from './map-article-to-search-result.helper.js';

describe('mapArticleToSearchResult', () => {
  it('normalizes an article into the search-result shape', () => {
    expect(
      mapArticleToSearchResult({
        url: 'https://example.com',
        title: 'Title',
        snippet: 'Snippet',
      }),
    ).toEqual({
      url: 'https://example.com',
      title: 'Title',
      snippet: 'Snippet',
    });
  });

  it('falls back to empty strings for non-string fields', () => {
    expect(mapArticleToSearchResult({ url: 1, title: null })).toEqual({
      url: '',
      title: undefined,
      snippet: '',
    });
  });
});
