import { describe, expect, it } from 'vitest';

import { IMAGE_MEDIA_TYPE_SIGNATURES, matchesMediaTypeSignature, MEDIA_TYPE } from './image-media-type.constants.ts';

describe('image-media-type.constants', () => {
  describe('IMAGE_MEDIA_TYPE_SIGNATURES', () => {
    it('contains all known image media types', () => {
      expect(Object.keys(IMAGE_MEDIA_TYPE_SIGNATURES).sort()).toEqual(
        ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].sort(),
      );
    });
  });

  describe('matchesMediaTypeSignature', () => {
    it('returns true when all non-null bytes match', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(matchesMediaTypeSignature(buffer, IMAGE_MEDIA_TYPE_SIGNATURES[MEDIA_TYPE.PNG])).toBe(true);
    });

    it('ignores null wildcards', () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      expect(matchesMediaTypeSignature(buffer, IMAGE_MEDIA_TYPE_SIGNATURES[MEDIA_TYPE.GIF])).toBe(true);
    });

    it('returns false when buffer is shorter than signature', () => {
      const buffer = Buffer.from([0xff, 0xd8]);
      expect(matchesMediaTypeSignature(buffer, IMAGE_MEDIA_TYPE_SIGNATURES[MEDIA_TYPE.JPEG])).toBe(false);
    });

    it('returns false when bytes do not match', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(matchesMediaTypeSignature(buffer, IMAGE_MEDIA_TYPE_SIGNATURES[MEDIA_TYPE.PNG])).toBe(false);
    });
  });
});
