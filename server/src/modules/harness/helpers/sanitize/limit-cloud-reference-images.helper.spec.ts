import { describe, expect, it } from 'vitest';

import type { IngestedImage } from '../media/download-and-ingest-images.types.js';

import { limitCloudReferenceImages } from './limit-cloud-reference-images.helper.js';

const image = (imageUrl: string): IngestedImage =>
  ({
    imageUrl,
    imageAlt: '',
    title: '',
    caption: '',
    source: 'cloud',
    hash: '',
    name: '',
    sourceUrl: '',
    fingerprint: '',
  }) as IngestedImage;

describe('limitCloudReferenceImages', () => {
  it('caps the number of images', () => {
    const images = [image('a'), image('b'), image('c')];
    expect(limitCloudReferenceImages(images, 2)).toEqual([
      image('a'),
      image('b'),
    ]);
  });

  it('returns all images when under the cap', () => {
    const images = [image('a'), image('b')];
    expect(limitCloudReferenceImages(images, 5)).toEqual(images);
  });

  it('returns an empty array for undefined input', () => {
    expect(limitCloudReferenceImages(undefined as never, 2)).toEqual([]);
  });
});
