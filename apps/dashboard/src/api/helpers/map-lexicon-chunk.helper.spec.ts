import { describe, expect, it } from 'vitest';

import { mapLexiconChunk } from './map-lexicon-chunk.helper';

describe('mapLexiconChunk', () => {
  it('normalizes a lexicon chunk', () => {
    expect(
      mapLexiconChunk({
        id: 'c1',
        content: 'Body',
        url: 'https://example.com',
        domain: 'example.com',
        title: 'Title',
        fetchedAt: '2025-01-01',
        contentHash: 'h1',
        chunkIndex: 1,
        chunkCount: 2,
        partitionScope: 'p1',
      }),
    ).toEqual({
      id: 'c1',
      content: 'Body',
      url: 'https://example.com',
      domain: 'example.com',
      title: 'Title',
      fetchedAt: '2025-01-01',
      contentHash: 'h1',
      chunkIndex: 1,
      chunkCount: 2,
      partitionScope: 'p1',
    });
  });

  it('falls back to defaults for missing fields', () => {
    expect(
      mapLexiconChunk({ content: 'Body', url: 'https://example.com' }),
    ).toEqual({
      id: '',
      content: 'Body',
      url: 'https://example.com',
      domain: '',
      title: undefined,
      fetchedAt: '',
      contentHash: '',
      chunkIndex: 0,
      chunkCount: 0,
      partitionScope: '',
    });
  });
});
