import { describe, expect, it } from 'vitest';

import { isImageContentType } from './is-image-content-type.helper.js';

describe('isImageContentType', () => {
  it('returns true for image content types', () => {
    expect(isImageContentType('image/jpeg')).toBe(true);
    expect(isImageContentType('image/png')).toBe(true);
    expect(isImageContentType('IMAGE/WEBP')).toBe(true);
  });

  it('returns false for non-image content types', () => {
    expect(isImageContentType('text/html')).toBe(false);
    expect(isImageContentType('video/mp4')).toBe(false);
  });

  it('returns false for undefined or empty', () => {
    expect(isImageContentType(undefined)).toBe(false);
    expect(isImageContentType('')).toBe(false);
  });
});
