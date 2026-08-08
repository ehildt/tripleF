import { describe, expect, it } from 'vitest';

import { isGoogleHostUrl } from './is-google-host-url.helper.js';

describe('isGoogleHostUrl', () => {
  it('matches google.com and regional variants', () => {
    expect(isGoogleHostUrl('https://www.google.com/search?q=x')).toBe(true);
    expect(isGoogleHostUrl('https://www.google.de/')).toBe(true);
    expect(isGoogleHostUrl('https://shopping.google.co.uk/')).toBe(true);
  });

  it('rejects non-google hosts', () => {
    expect(isGoogleHostUrl('https://example.com/')).toBe(false);
    expect(isGoogleHostUrl('https://notgoogle.com/')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isGoogleHostUrl('not a url')).toBe(false);
  });
});
