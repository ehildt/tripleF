import { describe, expect, it } from 'vitest';

import { mapStreamMeta } from './map-stream-meta.helper.js';

describe('mapStreamMeta', () => {
  it('projects a gallery image into the stream meta shape', () => {
    expect(
      mapStreamMeta({
        imageUrl: 'https://example.com/storage/abc123',
        title: 'Image',
        source: 'cloud',
      }),
    ).toEqual({
      name: 'Image',
      hash: 'abc123',
      source: 'cloud',
      variant: 'original',
    });
  });

  it('falls back to an empty hash', () => {
    expect(mapStreamMeta({ imageUrl: 'https://example.com/' }).hash).toBe('');
  });
});
