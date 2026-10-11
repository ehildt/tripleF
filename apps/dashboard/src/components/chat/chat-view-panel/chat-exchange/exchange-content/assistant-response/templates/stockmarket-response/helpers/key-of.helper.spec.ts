import { describe, expect, it } from 'vitest';

import { keyOf } from './key-of.helper';

describe('keyOf', () => {
  it('normalizes a URL by trimming, lowercasing, and stripping trailing slashes', () => {
    expect(keyOf('  HTTPS://Example.com/ ', undefined)).toBe(
      'https://example.com',
    );
  });

  it('falls back to a normalized title when there is no URL', () => {
    expect(keyOf(undefined, '  Example Title ')).toBe('example title');
  });

  it('returns an empty string when both are empty', () => {
    expect(keyOf('', '')).toBe('');
  });
});
