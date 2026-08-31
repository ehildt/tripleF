import { describe, expect, it } from 'vitest';

import { mapHitToChunk } from './map-hit-to-chunk.helper.js';

describe('mapHitToChunk', () => {
  it('projects a encyclopedia hit into the selected-chunk shape', () => {
    expect(
      mapHitToChunk({
        id: 'id1',
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
        score: 0.8,
      }),
    ).toEqual({
      url: 'https://example.com',
      title: 'Title',
      content: 'Body',
      score: 0.8,
      sourceType: 'content',
    });
  });
});
