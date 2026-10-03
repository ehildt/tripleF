import { describe, expect, it } from 'vitest';

import { safeMediaUrl } from './safe-media-url.helper.js';

describe('safeMediaUrl', () => {
  it('accepts same-origin storage paths', () => {
    expect(safeMediaUrl().safeParse('/api/v1/storage/session/chat/abc123').success).toBe(true);
  });

  it('accepts absolute http(s) URLs', () => {
    expect(safeMediaUrl().safeParse('https://example.com/photo.jpg').success).toBe(true);
  });

  it('rejects unrelated relative paths', () => {
    expect(safeMediaUrl().safeParse('/images/hero.png').success).toBe(false);
  });

  it('rejects non-http(s) schemes and unparseable values', () => {
    expect(safeMediaUrl().safeParse('javascript:alert(1)').success).toBe(false);
    expect(safeMediaUrl().safeParse('not-a-url').success).toBe(false);
  });

  it('uses the default message', () => {
    expect(safeMediaUrl().safeParse('not-a-url').error?.issues[0].message).toBe('must be a safe media URL');
  });

  it('supports a custom message', () => {
    expect(safeMediaUrl('images must be safe').safeParse('not-a-url').error?.issues[0].message).toBe(
      'images must be safe',
    );
  });
});
