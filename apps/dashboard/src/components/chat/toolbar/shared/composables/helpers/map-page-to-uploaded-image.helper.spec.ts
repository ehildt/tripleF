import { describe, expect, it } from 'vitest';

import { mapPageToUploadedImage } from './map-page-to-uploaded-image.helper';

describe('mapPageToUploadedImage', () => {
  it('projects a page image into an uploaded image', () => {
    const result = mapPageToUploadedImage(
      { name: 'doc.pdf · page 1', hash: 'h1' },
      'c1',
    );
    expect(result).toMatchObject({
      name: 'doc.pdf · page 1',
      hash: 'h1',
      size: 0,
      selected: true,
      conversationId: 'c1',
    });
  });
});
