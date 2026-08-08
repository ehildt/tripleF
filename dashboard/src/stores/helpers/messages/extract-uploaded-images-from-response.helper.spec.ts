import { describe, expect, it } from 'vitest';

import { extractUploadedImagesFromResponse } from './extract-uploaded-images-from-response.helper';

describe('extractUploadedImagesFromResponse', () => {
  it('maps original meta entries to uploaded images', () => {
    const images = extractUploadedImagesFromResponse(
      {
        meta: [
          { name: 'a.png', hash: 'ha', size: 10 },
          {
            name: 'b.png',
            hash: 'hb',
            size: 20,
            variant: 'original',
            source: 'cloud',
          },
        ],
      },
      'conv-1',
    );

    expect(images).toHaveLength(2);
    expect(images[0]).toMatchObject({
      name: 'a.png',
      hash: 'ha',
      size: 10,
      selected: true,
      conversationId: 'conv-1',
      source: 'local',
      uploadedAt: expect.any(Number),
    });
    expect(images[1].source).toBe('cloud');
  });

  it('skips derived variants and malformed entries', () => {
    const images = extractUploadedImagesFromResponse(
      {
        meta: [
          { name: 'a.png', hash: 'ha', variant: 'thumb' },
          { name: 'nohash' },
        ],
      },
      'conv-1',
    );

    expect(images).toEqual([]);
  });

  it('returns an empty list when meta is missing or not an array', () => {
    expect(extractUploadedImagesFromResponse({}, 'conv-1')).toEqual([]);
    expect(
      extractUploadedImagesFromResponse({ meta: 'nope' }, 'conv-1'),
    ).toEqual([]);
  });
});
