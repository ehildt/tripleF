import { describe, expect, it } from 'vitest';

import { mapLexiconLedgerRowToPending } from './map-lexicon-ledger-row-to-pending.helper.js';

describe('mapLexiconLedgerRowToPending', () => {
  it('projects a lexicon ledger row into the pending-entry shape', () => {
    const createdAt = new Date('2025-01-01T00:00:00Z');
    expect(
      mapLexiconLedgerRowToPending({
        id: 'id1',
        url: 'https://example.com',
        contentHash: 'h1',
        chunkCount: 2,
        partitionScope: 'p1',
        title: 'Title',
        requestId: 'r1',
        createdAt,
        sweptAt: null,
      }),
    ).toEqual({
      id: 'id1',
      url: 'https://example.com',
      contentHash: 'h1',
      chunkCount: 2,
      partitionScope: 'p1',
      title: 'Title',
      requestId: 'r1',
      createdAt,
    });
  });
});
