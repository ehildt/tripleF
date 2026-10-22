import { describe, expect, it } from 'vitest';

import { mapUploadedDocument } from './map-uploaded-document.helper';

describe('mapUploadedDocument', () => {
  it('defaults an uploaded document to selected', () => {
    expect(
      mapUploadedDocument({
        name: 'doc.pdf',
        hash: 'h1',
        type: 'application/pdf',
        uploadedAt: 1,
        conversationId: 'c1',
      }),
    ).toMatchObject({ selected: true });
  });

  it('keeps an explicit selection', () => {
    expect(
      mapUploadedDocument({
        name: 'doc.pdf',
        hash: 'h1',
        type: 'application/pdf',
        uploadedAt: 1,
        conversationId: 'c1',
        selected: false,
      }).selected,
    ).toBe(false);
  });
});
