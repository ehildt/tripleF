import { describe, expect, it } from 'vitest';

import { mapItemWithBucket } from './map-item-with-bucket.helper.js';

describe('mapItemWithBucket', () => {
  it('stamps a video item with its bucket', () => {
    expect(
      mapItemWithBucket({ videoUrl: 'https://example.com/v.mp4' }, 'youtube'),
    ).toEqual({
      videoUrl: 'https://example.com/v.mp4',
      bucket: 'youtube',
    });
  });
});
