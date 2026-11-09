import { describe, expect, it } from 'vitest';

import { extractUploadedImagesFromResponse } from './extract-uploaded-images-from-response.helper';

describe('extractUploadedImagesFromResponse', () => {
  it('maps original meta entries to uploaded images', () => {
    const images = extractUploadedImagesFromResponse(
      [
        { name: 'a.png', hash: 'ha', size: 10 },
        {
          name: 'b.png',
          hash: 'hb',
          size: 20,
          variant: 'original',
          source: 'cloud',
        },
      ],
      'conv-1',
      123,
    );

    expect(images).toHaveLength(2);
    expect(images[0]).toMatchObject({
      name: 'a.png',
      hash: 'ha',
      size: 10,
      selected: true,
      conversationId: 'conv-1',
      source: 'local',
      uploadedAt: 123,
    });
    expect(images[1].source).toBe('cloud');
  });

  it('skips derived variants and malformed entries', () => {
    const images = extractUploadedImagesFromResponse(
      [
        { name: 'a.png', hash: 'ha', variant: 'thumb' },
        { name: 'nohash' },
        null,
      ],
      'conv-1',
      123,
    );

    expect(images).toEqual([]);
  });

  it('returns an empty list when meta is missing or not an array', () => {
    expect(extractUploadedImagesFromResponse(undefined, 'conv-1', 123)).toEqual(
      [],
    );
    expect(extractUploadedImagesFromResponse('nope', 'conv-1', 123)).toEqual(
      [],
    );
  });
});
