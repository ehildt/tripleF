import { describe, expect, it } from 'vitest';

import { mapEntryToChunk } from './map-entry-to-chunk.helper.js';

describe('mapEntryToChunk', () => {
  it('assembles a lexicon snippet point from a search result', () => {
    const chunk = mapEntryToChunk(
      {
        url: 'https://example.com',
        title: 'Title',
        snippet: 'Snippet',
        contentHash: 'h1',
        domain: 'example.com',
      },
      0,
      [[1, 2]],
      '2025-01-01',
      'p1',
    );
    expect(chunk.content).toBe('Snippet');
    expect(chunk.vector).toEqual([1, 2]);
    expect(chunk.chunkIndex).toBe(0);
    expect(chunk.chunkCount).toBe(1);
    expect(chunk.sourceType).toBe('result');
    expect(chunk.id).toBeTruthy();
  });
});
