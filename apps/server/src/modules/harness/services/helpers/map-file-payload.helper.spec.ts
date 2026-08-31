import { describe, expect, it } from 'vitest';

import { mapFilePayload } from './map-file-payload.helper.js';

describe('mapFilePayload', () => {
  it('converts a multipart file into a buffer + meta payload', async () => {
    const file = {
      filename: 'img.png',
      mimetype: 'image/png',
      toBuffer: async () => Buffer.from('abc'),
    } as never;
    const result = await mapFilePayload(file, 0, undefined, false);
    expect(result.buffer).toEqual(Buffer.from('abc'));
    expect(result.meta).toMatchObject({
      name: 'img.png',
      type: 'image/png',
      size: 3,
      fingerprint: undefined,
    });
    expect(result.meta.hash).toBeTruthy();
  });

  it('uses the provided hash when available', async () => {
    const file = {
      filename: 'img.png',
      mimetype: 'image/png',
      toBuffer: async () => Buffer.from('abc'),
    } as never;
    const result = await mapFilePayload(file, 0, ['provided-hash'], false);
    expect(result.meta.hash).toBe('provided-hash');
  });
});
