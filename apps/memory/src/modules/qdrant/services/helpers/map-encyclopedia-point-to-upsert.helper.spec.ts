import { describe, expect, it } from 'vitest';

import { mapEncyclopediaPointToUpsert } from './map-encyclopedia-point-to-upsert.helper.js';

describe('mapEncyclopediaPointToUpsert', () => {
  it('builds a Qdrant upsert point from a encyclopedia chunk point', () => {
    expect(
      mapEncyclopediaPointToUpsert({
        id: 'id1',
        vector: [1, 2],
        content: 'Body',
        url: 'https://example.com',
        domain: 'example.com',
        title: 'Title',
        fetchedAt: '2025-01-01',
        contentHash: 'h1',
        chunkIndex: 0,
        chunkCount: 1,
        partitionScope: 'p1',
        sourceType: 'content',
      }),
    ).toEqual({
      id: 'id1',
      vector: [1, 2],
      payload: {
        content: 'Body',
        url: 'https://example.com',
        domain: 'example.com',
        title: 'Title',
        fetched_at: '2025-01-01',
        content_hash: 'h1',
        chunk_index: 0,
        chunk_count: 1,
        partition_scope: 'p1',
        source_type: 'content',
      },
    });
  });
});
