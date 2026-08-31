import { describe, expect, it } from 'vitest';

import { mapPreviewImage } from './map-preview-image.helper.js';

describe('mapPreviewImage', () => {
  it('encodes a preprocessed image into the preview shape', () => {
    expect(
      mapPreviewImage({
        variant: 'grayscale',
        meta: {
          name: 'img.png',
          type: 'image/png',
          hash: 'h',
          variant: 'grayscale',
        },
        description: 'Grayscale',
        buffer: Buffer.from('abc'),
      }),
    ).toEqual({
      variant: 'grayscale',
      name: 'img.png',
      description: 'Grayscale',
      dataUrl: 'data:image/png;base64,YWJj',
    });
  });
});
