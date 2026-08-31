import { describe, expect, it } from 'vitest';

import { mapUploadedDocumentAttachment } from './map-uploaded-document-attachment.helper';

describe('mapUploadedDocumentAttachment', () => {
  it('normalizes an uploaded document', () => {
    expect(
      mapUploadedDocumentAttachment({
        name: 'doc.pdf',
        hash: 'h1',
        type: 'application/pdf',
        uploadedAt: 1,
        conversationId: 'c1',
      }),
    ).toEqual({
      id: 'uploaded-document-h1',
      name: 'doc.pdf',
      hash: 'h1',
      previewUrl: '',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      source: 'local',
      kind: 'document',
    });
  });
});
