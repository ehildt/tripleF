import { describe, expect, it } from 'vitest';

import { mapImageToMetadata } from './map-image-to-metadata.helper';

describe('mapImageToMetadata', () => {
  it('projects an image into the metadata shape', () => {
    expect(mapImageToMetadata({ name: 'img.png', hash: 'h1' })).toEqual({
      name: 'img.png',
      hash: 'h1',
    });
  });
});
