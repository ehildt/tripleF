import { describe, expect, it } from 'vitest';

import { mapSerperImageResult } from './map-serper-image-result.helper.js';

describe('mapSerperImageResult', () => {
  it('maps an image item to the image-search result shape', () => {
    expect(
      mapSerperImageResult({
        title: 'Photo',
        imageUrl: 'https://example.com/img.jpg',
        link: 'https://example.com/page',
        imageWidth: 1920,
        imageHeight: 1080,
        source: 'Example',
        domain: 'example.com',
      }),
    ).toEqual({
      title: 'Photo',
      imageUrl: 'https://example.com/img.jpg',
      sourcePageUrl: 'https://example.com/page',
      width: 1920,
      height: 1080,
      source: 'Example',
      domain: 'example.com',
    });
  });

  it('falls back to the legacy image field and width/height fields', () => {
    expect(
      mapSerperImageResult({
        image: 'https://example.com/legacy.jpg',
        width: 800,
        height: 600,
      }),
    ).toEqual({
      title: '',
      imageUrl: 'https://example.com/legacy.jpg',
      sourcePageUrl: '',
      width: 800,
      height: 600,
      source: '',
      domain: '',
    });
  });
});
