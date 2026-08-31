import { describe, expect, it } from 'vitest';

import { mapDocumentEntry } from './map-document-entry.helper';

describe('mapDocumentEntry', () => {
  it('converts a pending document entry into an uploaded document', () => {
    const result = mapDocumentEntry(
      {
        file: { name: 'doc.pdf', type: 'application/pdf', size: 10 } as File,
        isSelected: true,
        objectUrl: 'blob:1',
        hash: 'h1',
        conversationId: 'c1',
        kind: 'document',
      },
      'c1',
    );
    expect(result).toMatchObject({
      name: 'doc.pdf',
      hash: 'h1',
      type: 'application/pdf',
      size: 10,
      selected: true,
      conversationId: 'c1',
    });
  });
});
