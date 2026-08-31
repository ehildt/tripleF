import { describe, expect, it } from 'vitest';

import { mapBrightDataImageResult } from './map-bright-data-image-result.helper.js';

describe('mapBrightDataImageResult', () => {
  it('maps an image item to the image-search result shape', () => {
    expect(
      mapBrightDataImageResult({
        title: 'Photo',
        original_image: 'https://example.com/img.jpg',
        source_link: 'https://example.com/page',
        width: 1920,
        height: 1080,
        source: 'Example',
      }),
    ).toEqual({
      title: 'Photo',
      imageUrl: 'https://example.com/img.jpg',
      sourcePageUrl: 'https://example.com/page',
      width: 1920,
      height: 1080,
      source: 'Example',
      domain: '',
    });
  });

  it('falls back through the legacy image fields', () => {
    expect(
      mapBrightDataImageResult({
        image_url: 'https://example.com/legacy.jpg',
        link: 'https://example.com/page',
      }),
    ).toEqual({
      title: '',
      imageUrl: 'https://example.com/legacy.jpg',
      sourcePageUrl: 'https://example.com/page',
      width: undefined,
      height: undefined,
      source: '',
      domain: '',
    });
  });
});
