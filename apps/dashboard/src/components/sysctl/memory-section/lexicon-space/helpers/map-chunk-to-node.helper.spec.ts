import { describe, expect, it } from 'vitest';

import { mapChunkToNode } from './map-chunk-to-node.helper';

describe('mapChunkToNode', () => {
  it('maps a lexicon chunk to a constellation node', () => {
    const node = mapChunkToNode({
      id: 'c1',
      content: 'Body',
      url: 'https://example.com',
      domain: 'example.com',
      title: 'Title',
      fetchedAt: '2025-01-01',
      contentHash: 'h1',
      chunkIndex: 0,
      chunkCount: 2,
      partitionScope: 'p1',
    });
    expect(node.id).toBe('c1');
    expect(node.clusterKey).toBe('example.com');
    expect(node.meta).toHaveLength(3);
  });

  it('falls back to the unknown domain', () => {
    expect(
      mapChunkToNode({
        id: 'c1',
        content: 'Body',
        url: 'https://example.com',
        domain: '',
        fetchedAt: '2025-01-01',
        contentHash: 'h1',
        chunkIndex: 0,
        chunkCount: 1,
        partitionScope: 'p1',
      }).clusterKey,
    ).toBe('unknown');
  });
});
