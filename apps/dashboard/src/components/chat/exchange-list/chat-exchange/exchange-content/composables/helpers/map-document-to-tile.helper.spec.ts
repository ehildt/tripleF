import { describe, expect, it } from 'vitest';

import { mapDocumentToTile } from './map-document-to-tile.helper';

describe('mapDocumentToTile', () => {
  it('projects a document into the tile shape', () => {
    expect(
      mapDocumentToTile(
        { name: 'doc.pdf', hash: 'h1' },
        'https://example.com/h1',
      ),
    ).toEqual({ name: 'doc.pdf', url: 'https://example.com/h1' });
  });
});
