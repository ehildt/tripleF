import { describe, expect, it } from 'vitest';

import { mapEncyclopediaPointToIdVector } from './map-encyclopedia-point-to-id-vector.helper.js';

describe('mapEncyclopediaPointToIdVector', () => {
  it('projects a encyclopedia point into its id/vector pair', () => {
    expect(
      mapEncyclopediaPointToIdVector({
        id: 'id1',
        vector: [1, 2],
        content: 'Body',
        url: 'https://example.com',
        domain: 'example.com',
        fetchedAt: '2025-01-01',
        contentHash: 'h1',
        chunkIndex: 0,
        chunkCount: 1,
        partitionScope: 'p1',
        sourceType: 'content',
      }),
    ).toEqual({ id: 'id1', vector: [1, 2] });
  });
});
