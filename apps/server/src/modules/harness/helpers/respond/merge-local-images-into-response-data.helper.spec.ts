import { describe, expect, it } from 'vitest';

import { mergeLocalImagesIntoResponseData } from './merge-local-images-into-response-data.helper.js';

describe('mergeLocalImagesIntoResponseData', () => {
  it('returns data unchanged when there is no data', () => {
    expect(mergeLocalImagesIntoResponseData(undefined, [])).toBe(undefined);
  });

  it('merges local images not already present', () => {
    const data = {
      galleryItems: [
        { imageUrl: '/storage/abc', imageAlt: 'a', title: 'A', caption: 'A' },
      ],
    };
    const result = mergeLocalImagesIntoResponseData(data, [
      {
        imageUrl: '/storage/def',
        imageAlt: 'local',
        title: 'Local',
        caption: 'Local',
        source: 'local',
      },
    ]);
    expect(result?.galleryItems).toHaveLength(2);
  });

  it('does not duplicate an existing image by hash', () => {
    const data = {
      galleryItems: [
        { imageUrl: '/storage/abc', imageAlt: 'a', title: 'A', caption: 'A' },
      ],
    };
    const result = mergeLocalImagesIntoResponseData(data, [
      {
        imageUrl: '/storage/abc',
        imageAlt: 'local',
        title: 'Local',
        caption: 'Local',
        source: 'local',
      },
    ]);
    expect(result?.galleryItems).toHaveLength(1);
  });

  it('drops a gallery tile that repeats the hero image', () => {
    const data = {
      heroImageUrl: '/storage/abc',
      galleryItems: [
        { imageUrl: '/storage/abc', imageAlt: 'a', title: 'A', caption: 'A' },
      ],
    };
    const result = mergeLocalImagesIntoResponseData(data, []);
    expect(result?.galleryItems).toEqual([]);
  });
});
