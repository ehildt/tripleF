import { describe, expect, it } from 'vitest';

import { mapPreviewVariant } from './map-preview-variant.helper';

describe('mapPreviewVariant', () => {
  it('projects a preview variant into the lightbox shape', () => {
    expect(
      mapPreviewVariant({
        variant: 'grayscale',
        name: 'img.png',
        description: 'Grayscale',
        dataUrl: 'data:image/png;base64,abc',
      }),
    ).toEqual({
      url: 'data:image/png;base64,abc',
      title: 'grayscale — Grayscale',
    });
  });
});
