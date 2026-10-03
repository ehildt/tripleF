import { describe, expect, it } from 'vitest';

import { safeMediaUrlOrEmpty } from './safe-media-url-or-empty.helper.js';

describe('safeMediaUrlOrEmpty', () => {
  it('accepts an empty string', () => {
    expect(safeMediaUrlOrEmpty().safeParse('').success).toBe(true);
  });

  it('accepts a storage path or an absolute URL', () => {
    expect(safeMediaUrlOrEmpty().safeParse('/api/v1/storage/session/chat/abc').success).toBe(true);
    expect(safeMediaUrlOrEmpty().safeParse('https://example.com/photo.jpg').success).toBe(true);
  });

  it('rejects an unsafe value', () => {
    expect(safeMediaUrlOrEmpty().safeParse('not-a-url').success).toBe(false);
    expect(safeMediaUrlOrEmpty().safeParse('javascript:alert(1)').success).toBe(false);
  });
});
