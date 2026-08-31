import { describe, expect, it } from 'vitest';

import { mapIngestedMeta } from './map-ingested-meta.helper.js';

describe('mapIngestedMeta', () => {
  it('projects an ingested image into the processed-meta shape', () => {
    expect(
      mapIngestedMeta({
        imageUrl: 'https://example.com/img.jpg',
        imageAlt: 'alt',
        title: 'Title',
        caption: 'Caption',
        source: 'cloud',
        hash: 'h1',
        name: 'img.jpg',
        sourceUrl: 'https://example.com/img.jpg',
        fingerprint: 'fp1',
      }),
    ).toEqual({
      name: 'img.jpg',
      hash: 'h1',
      type: 'image/png',
      variant: 'original',
      source: 'cloud',
    });
  });
});
