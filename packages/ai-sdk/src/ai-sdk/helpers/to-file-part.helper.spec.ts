import { describe, expect, it } from 'vitest';

import { MEDIA_TYPE } from '../constants/image-media-type.constants.ts';

import { toBuffer, toFilePart } from './to-file-part.helper.ts';

describe('to-file-part.helper', () => {
  describe('toBuffer', () => {
    it('returns a Uint8Array unchanged', () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff]);
      expect(toBuffer(buffer)).toBe(buffer);
    });

    it('decodes a base64 string', () => {
      const base64 = Buffer.from([0xff, 0xd8, 0xff]).toString('base64');
      expect(toBuffer(base64)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    });
  });

  describe('toFilePart', () => {
    it('builds a file part from a buffer with detected media type', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      expect(toFilePart(buffer)).toEqual({
        type: 'file',
        data: Buffer.from(buffer).toString('base64'),
        mediaType: MEDIA_TYPE.PNG,
      });
    });

    it('builds a file part from a base64 string with detected media type', () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

      expect(toFilePart(base64)).toEqual({
        type: 'file',
        data: Buffer.from(base64, 'base64').toString('base64'),
        mediaType: MEDIA_TYPE.PNG,
      });
    });
  });
});
