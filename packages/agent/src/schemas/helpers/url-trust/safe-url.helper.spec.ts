import { describe, expect, it } from 'vitest';

import { safeUrl } from './safe-url.helper.js';

describe('safeUrl', () => {
  it('accepts public page URLs', () => {
    expect(safeUrl().safeParse('https://example.com/article').success).toBe(true);
    expect(safeUrl().safeParse('https://www.bbc.com/news/123456').success).toBe(true);
  });

  it('rejects syntactically invalid URLs', () => {
    const result = safeUrl().safeParse('not-a-url');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('must be a valid URL');
  });

  it('rejects static asset URLs with the trust message', () => {
    const result = safeUrl().safeParse('https://example.com/photo.png');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('must be a safe URL');
  });

  it('rejects private and localhost URLs', () => {
    expect(safeUrl().safeParse('https://localhost/article').success).toBe(false);
    expect(safeUrl().safeParse('https://192.168.1.1/article').success).toBe(false);
  });

  it('rejects non-HTTP schemes', () => {
    expect(safeUrl().safeParse('javascript:alert(1)').success).toBe(false);
  });

  it('supports a custom string message', () => {
    const result = safeUrl('links must be public').safeParse('https://example.com/photo.png');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('links must be public');
  });

  it('supports the object message form', () => {
    const result = safeUrl({ message: 'links must be public' }).safeParse('https://example.com/photo.png');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('links must be public');
  });
});
