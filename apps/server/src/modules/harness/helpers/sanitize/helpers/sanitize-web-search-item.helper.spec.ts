import { describe, expect, it } from 'vitest';

import { sanitizeWebSearchItem } from './sanitize-web-search-item.helper.js';

describe('sanitizeWebSearchItem', () => {
  it('returns an item without any url field unchanged', () => {
    const item = { title: 'No urls' };
    expect(sanitizeWebSearchItem(item)).toBe(item);
  });

  it('blanks an untrusted image url', () => {
    expect(
      sanitizeWebSearchItem({ imageUrl: 'https://example.com/page' }),
    ).toEqual({ imageUrl: '' });
  });
});
