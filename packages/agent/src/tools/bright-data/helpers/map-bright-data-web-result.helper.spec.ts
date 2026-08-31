import { describe, expect, it } from 'vitest';

import { mapBrightDataWebResult } from './map-bright-data-web-result.helper.js';

describe('mapBrightDataWebResult', () => {
  it('maps an organic result to the web-search result shape', () => {
    expect(
      mapBrightDataWebResult({
        title: 'Example',
        link: 'https://example.com',
        description: 'A snippet',
      }),
    ).toEqual({
      title: 'Example',
      snippet: 'A snippet',
      url: 'https://example.com',
      source: 'brightData',
    });
  });

  it('falls back to an empty snippet', () => {
    expect(
      mapBrightDataWebResult({
        title: 'Example',
        link: 'https://example.com',
        description: '',
      }).snippet,
    ).toBe('');
  });
});
