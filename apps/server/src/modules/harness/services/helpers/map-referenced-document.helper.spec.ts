import { describe, expect, it } from 'vitest';

import { mapReferencedDocument } from './map-referenced-document.helper.js';

describe('mapReferencedDocument', () => {
  it('projects a referenced document into the meta shape', () => {
    expect(
      mapReferencedDocument({
        name: 'doc.pdf',
        hash: 'h1',
        type: 'application/pdf',
      }),
    ).toEqual({
      name: 'doc.pdf',
      type: 'application/pdf',
      hash: 'h1',
      size: 0,
    });
  });

  it('falls back to an empty type', () => {
    expect(mapReferencedDocument({ name: 'doc.pdf', hash: 'h1' }).type).toBe(
      '',
    );
  });
});
