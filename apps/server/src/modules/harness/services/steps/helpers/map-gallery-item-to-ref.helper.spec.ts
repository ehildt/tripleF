import { describe, expect, it } from 'vitest';

import { mapGalleryItemToRef } from './map-gallery-item-to-ref.helper.js';

describe('mapGalleryItemToRef', () => {
  it('projects a gallery item into the reference shape', () => {
    expect(
      mapGalleryItemToRef({
        imageUrl: 'https://example.com/img.jpg',
        title: 'T',
      }),
    ).toEqual({ imageUrl: 'https://example.com/img.jpg', title: 'T' });
  });
});
