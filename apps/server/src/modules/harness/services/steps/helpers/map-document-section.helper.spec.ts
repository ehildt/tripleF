import { describe, expect, it } from 'vitest';

import { mapDocumentSection } from './map-document-section.helper.js';

describe('mapDocumentSection', () => {
  it('projects a document section into the encyclopedia index shape', () => {
    expect(
      mapDocumentSection({
        name: 'doc.pdf',
        text: 'Body',
        url: 'https://example.com/doc.pdf',
      }),
    ).toEqual({
      url: 'https://example.com/doc.pdf',
      title: 'doc.pdf',
      content: 'Body',
    });
  });

  it('delegates the original upload metadata and MinIO link', () => {
    expect(
      mapDocumentSection({
        name: 'doc.pdf',
        text: 'Body',
        url: 'https://files.example.com/sess/conv/abc123',
        mimeType: 'application/pdf',
        sizeBytes: 245760,
        originalHash: 'abc123',
      }),
    ).toEqual({
      url: 'https://files.example.com/sess/conv/abc123',
      title: 'doc.pdf',
      content: 'Body',
      mimeType: 'application/pdf',
      sizeBytes: 245760,
      originalHash: 'abc123',
    });
  });
});
