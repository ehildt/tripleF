import { describe, expect, it } from 'vitest';

import { mapImageToTile } from './map-image-to-tile.helper';

describe('mapImageToTile', () => {
  it('projects an image into the tile shape', () => {
    expect(
      mapImageToTile({ name: 'img.png', hash: 'h1' }, 'https://example.com/h1'),
    ).toEqual({ url: 'https://example.com/h1', title: 'img.png' });
  });
});
