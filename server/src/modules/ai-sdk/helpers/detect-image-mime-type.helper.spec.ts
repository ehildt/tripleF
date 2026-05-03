import { describe, expect, it } from 'vitest';

import { MEDIA_TYPE } from '../constants/image-media-type.constants.js';

import {
  detectImageMimeType,
  UnsupportedImageFormatError,
} from './detect-image-mime-type.helper.js';

describe('detectImageMimeType', () => {
  it.each([
    [MEDIA_TYPE.PNG, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    [
      MEDIA_TYPE.WEBP,
      [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
    ],
    [MEDIA_TYPE.GIF, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    [MEDIA_TYPE.JPEG, [0xff, 0xd8, 0xff]],
  ])('detects %s', (expected, bytes) => {
    expect(detectImageMimeType(Buffer.from(bytes))).toBe(expected);
  });

  it('throws when format is not supported', () => {
    expect(() => detectImageMimeType(Buffer.from([0x00, 0x00, 0x00]))).toThrow(
      UnsupportedImageFormatError,
    );
  });
});
