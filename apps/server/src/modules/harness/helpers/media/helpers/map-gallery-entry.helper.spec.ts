import { describe, expect, it } from 'vitest';

import { mapGalleryEntry } from './map-gallery-entry.helper.js';

describe('mapGalleryEntry', () => {
  it('builds a gallery item from a meta entry', () => {
    expect(
      mapGalleryEntry(
        { name: 'img.png', hash: 'h1', type: 'image/png', source: 'cloud' },
        's1',
        'c1',
      ),
    ).toEqual({
      imageUrl: '/api/v1/storage/s1/c1/h1',
      imageAlt: 'img.png',
      title: 'img.png',
      caption: 'img.png',
      source: 'cloud',
    });
  });

  it('falls back to defaults for missing fields', () => {
    expect(mapGalleryEntry(undefined, undefined, undefined)).toEqual({
      imageUrl: '',
      imageAlt: 'image',
      title: 'image',
      caption: 'image',
      source: 'local',
    });
  });
});
