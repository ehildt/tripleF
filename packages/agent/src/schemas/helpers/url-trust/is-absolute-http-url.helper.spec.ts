import { describe, expect, it } from 'vitest';

import { isAbsoluteHttpUrl } from './is-absolute-http-url.helper.js';

describe('isAbsoluteHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isAbsoluteHttpUrl('https://example.com/article')).toBe(true);
    expect(isAbsoluteHttpUrl('http://example.com/article')).toBe(true);
  });

  it('rejects non-http(s) schemes', () => {
    expect(isAbsoluteHttpUrl('ftp://example.com/file')).toBe(false);
    expect(isAbsoluteHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isAbsoluteHttpUrl('data:text/plain,hello')).toBe(false);
  });

  it('rejects unparseable and empty values', () => {
    expect(isAbsoluteHttpUrl('not-a-url')).toBe(false);
    expect(isAbsoluteHttpUrl('')).toBe(false);
  });
});
