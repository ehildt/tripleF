import { describe, expect, it } from 'vitest';

import { mapSerperWebResult } from './map-serper-web-result.helper.js';

describe('mapSerperWebResult', () => {
  it('maps an organic result to the web-search result shape', () => {
    expect(
      mapSerperWebResult({
        title: 'Example',
        link: 'https://example.com',
        snippet: 'A snippet',
      }),
    ).toEqual({
      title: 'Example',
      snippet: 'A snippet',
      url: 'https://example.com',
      source: 'serper',
    });
  });

  it('falls back to an empty snippet', () => {
    expect(
      mapSerperWebResult({
        title: 'Example',
        link: 'https://example.com',
        snippet: '',
      }).snippet,
    ).toBe('');
  });
});
