import { describe, expect, it } from 'vitest';

import { mapDocumentSection } from './map-document-section.helper.js';

describe('mapDocumentSection', () => {
  it('projects a document section into the lexicon index shape', () => {
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
});
