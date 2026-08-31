import { describe, expect, it } from 'vitest';

import { mapContentToChunk } from './map-content-to-chunk.helper.js';

describe('mapContentToChunk', () => {
  it('assembles a lexicon chunk point from a document chunk', () => {
    const chunk = mapContentToChunk(
      'Body',
      0,
      [[1, 2]],
      { url: 'https://example.com', title: 'Title', content: 'Body' },
      'example.com',
      '2025-01-01',
      'h1',
      2,
      'p1',
    );
    expect(chunk.content).toBe('Body');
    expect(chunk.vector).toEqual([1, 2]);
    expect(chunk.url).toBe('https://example.com');
    expect(chunk.chunkIndex).toBe(0);
    expect(chunk.chunkCount).toBe(2);
    expect(chunk.sourceType).toBe('content');
    expect(chunk.id).toBeTruthy();
  });
});
