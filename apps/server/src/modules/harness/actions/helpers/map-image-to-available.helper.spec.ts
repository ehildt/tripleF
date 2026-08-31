import { describe, expect, it } from 'vitest';

import { mapImageToAvailable } from './map-image-to-available.helper.js';

describe('mapImageToAvailable', () => {
  it('projects a verified image into the available-media shape', () => {
    expect(
      mapImageToAvailable({
        imageUrl: 'https://example.com/img.jpg',
        title: 'T',
      }),
    ).toEqual({ url: 'https://example.com/img.jpg', title: 'T' });
  });
});
