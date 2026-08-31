import { describe, expect, it } from 'vitest';

import { mapUploadedImageAttachment } from './map-uploaded-image-attachment.helper';

describe('mapUploadedImageAttachment', () => {
  it('normalizes an uploaded image', () => {
    expect(
      mapUploadedImageAttachment({
        name: 'img.png',
        hash: 'h1',
        uploadedAt: 1,
        conversationId: 'c1',
        source: 'cloud',
      }),
    ).toEqual({
      id: 'uploaded-h1',
      name: 'img.png',
      hash: 'h1',
      previewUrl: '',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      source: 'cloud',
      kind: 'image',
    });
  });
});
