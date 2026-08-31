import { describe, expect, it } from 'vitest';

import { mapUrlToReplacement } from './map-url-to-replacement.helper.js';

describe('mapUrlToReplacement', () => {
  it('escapes a url for regex replacement', () => {
    expect(mapUrlToReplacement('https://example.com/a?b=1')).toEqual({
      url: 'https://example.com/a?b=1',
      escaped: 'https://example\\.com/a\\?b=1',
    });
  });
});
