import { describe, expect, it } from 'vitest';

import { mapUploadedImage } from './map-uploaded-image.helper';

describe('mapUploadedImage', () => {
  it('defaults an uploaded image to selected', () => {
    expect(
      mapUploadedImage({
        name: 'img.png',
        hash: 'h1',
        uploadedAt: 1,
        conversationId: 'c1',
      }),
    ).toMatchObject({ selected: true });
  });

  it('keeps an explicit selection', () => {
    expect(
      mapUploadedImage({
        name: 'img.png',
        hash: 'h1',
        uploadedAt: 1,
        conversationId: 'c1',
        selected: false,
      }).selected,
    ).toBe(false);
  });
});
