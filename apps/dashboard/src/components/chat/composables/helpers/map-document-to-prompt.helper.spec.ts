import { describe, expect, it } from 'vitest';

import { mapDocumentToPrompt } from './map-document-to-prompt.helper';

describe('mapDocumentToPrompt', () => {
  it('projects a document into the prompt shape', () => {
    expect(mapDocumentToPrompt({ name: 'doc.pdf', hash: 'h1' })).toEqual({
      name: 'doc.pdf',
      hash: 'h1',
    });
  });
});
