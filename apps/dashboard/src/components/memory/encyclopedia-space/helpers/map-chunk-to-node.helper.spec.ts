import { describe, expect, it } from 'vitest';

import { mapChunkToNode } from './map-chunk-to-node.helper';

describe('mapChunkToNode', () => {
  it('maps a encyclopedia chunk to a constellation node grouped by topic', () => {
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
      category: 'games',
      topic: 'wuthering waves',
    });
    expect(node.id).toBe('c1');
    expect(node.topicKey).toBe('wuthering waves');
    expect(node.clusterKey).toBe('games');
    expect(node.meta).toHaveLength(4);
  });

  it('surfaces the upload metadata for delegated documents', () => {
    const node = mapChunkToNode({
      id: 'c1',
      content: 'Body',
      url: '/api/v1/storage/s/c/h',
      domain: '',
      title: 'doc.pdf',
      fetchedAt: '2025-01-01',
      contentHash: 'h1',
      chunkIndex: 0,
      chunkCount: 1,
      partitionScope: 'p1',
      mimeType: 'application/pdf',
      sizeBytes: 245760,
      originalHash: 'abc123',
    });
    expect(node.meta).toContainEqual({
      label: 'type',
      value: 'application/pdf',
    });
    expect(node.meta).toContainEqual({ label: 'size', value: '240 KB' });
  });

  it('falls back to the domain when no topic is classified', () => {
    expect(
      mapChunkToNode({
        id: 'c1',
        content: 'Body',
        url: 'https://example.com',
        domain: 'example.com',
        fetchedAt: '2025-01-01',
        contentHash: 'h1',
        chunkIndex: 0,
        chunkCount: 1,
        partitionScope: 'p1',
      }).topicKey,
    ).toBe('example.com');
  });

  it('falls back to the unknown domain when neither topic nor domain exist', () => {
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
      }).topicKey,
    ).toBe('unknown');
  });
});
