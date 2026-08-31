import { describe, expect, it } from 'vitest';

import { mapPageToUploadedImage } from './map-page-to-uploaded-image.helper';

describe('mapPageToUploadedImage', () => {
  it('projects a page image into an uploaded image with its parent provenance', () => {
    const result = mapPageToUploadedImage(
      { name: 'doc.pdf · page 1', hash: 'h1', page: 1 },
      'c1',
      { parentHash: 'doc-hash', parentName: 'doc.pdf' },
    );
    expect(result).toMatchObject({
      name: 'doc.pdf · page 1',
      hash: 'h1',
      page: 1,
      parentHash: 'doc-hash',
      parentName: 'doc.pdf',
      size: 0,
      selected: true,
      conversationId: 'c1',
    });
  });
});
