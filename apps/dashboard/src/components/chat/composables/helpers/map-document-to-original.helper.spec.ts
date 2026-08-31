import { describe, expect, it } from 'vitest';

import { mapDocumentToOriginal } from './map-document-to-original.helper';

describe('mapDocumentToOriginal', () => {
  it('projects a document into the original shape', () => {
    expect(
      mapDocumentToOriginal({
        name: 'doc.pdf',
        hash: 'h1',
        type: 'application/pdf',
      }),
    ).toEqual({ name: 'doc.pdf', hash: 'h1', type: 'application/pdf' });
  });
});
