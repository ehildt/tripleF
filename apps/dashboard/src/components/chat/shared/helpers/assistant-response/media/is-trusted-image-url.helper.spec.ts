import { describe, expect, it } from 'vitest';

import { isTrustedImageUrl } from './is-trusted-image-url.helper';

describe('isTrustedImageUrl', () => {
  it('rejects empty input', () => {
    expect(isTrustedImageUrl('')).toBe(false);
  });

  it('accepts relative storage URLs', () => {
    expect(isTrustedImageUrl('/storage/hero.jpg')).toBe(true);
  });

  it('accepts image data URIs', () => {
    expect(isTrustedImageUrl('data:image/png;base64,AAAA')).toBe(true);
  });

  it('rejects blocked thumbnail hosts', () => {
    expect(
      isTrustedImageUrl('https://encrypted-tbn0.gstatic.com/images?q=x'),
    ).toBe(false);
  });

  it('accepts trusted hosts without an image extension', () => {
    expect(isTrustedImageUrl('https://i.imgur.com/abc')).toBe(true);
  });

  it('accepts a direct image extension on an unknown host', () => {
    expect(isTrustedImageUrl('https://cdn.example.com/pic.jpg')).toBe(true);
  });

  it('rejects unknown hosts without an image extension', () => {
    expect(isTrustedImageUrl('https://example.com/page')).toBe(false);
  });

  it('rejects non-http protocols', () => {
    expect(isTrustedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isTrustedImageUrl('ftp://example.com/pic.jpg')).toBe(false);
  });

  it('accepts private/localhost only for direct image files', () => {
    expect(isTrustedImageUrl('http://localhost:9000/object.jpg')).toBe(true);
    expect(isTrustedImageUrl('http://localhost:9000/api/object')).toBe(false);
  });

  it('rejects unparseable URLs', () => {
    expect(isTrustedImageUrl('not a url')).toBe(false);
  });
});
