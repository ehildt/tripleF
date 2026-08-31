import { describe, expect, it } from 'vitest';

import type { EncyclopediaChunkRecord } from '@/api/memory.api';

import { buildEncyclopediaNodes } from './build-encyclopedia-nodes.helper';

const makeChunk = (
  overrides: Partial<EncyclopediaChunkRecord>,
): EncyclopediaChunkRecord =>
  ({
    id: 'c',
    content: 'content',
    url: 'https://example.com/a',
    domain: 'example.com',
    fetchedAt: '2024-01-01T00:00:00Z',
    contentHash: 'h',
    chunkIndex: 0,
    chunkCount: 1,
    partitionScope: 'global',
    ...overrides,
  }) as EncyclopediaChunkRecord;

describe('buildEncyclopediaNodes', () => {
  it('topics by topic', () => {
    const nodes = buildEncyclopediaNodes([
      makeChunk({ id: 'a', topic: 'wuthering waves' }),
      makeChunk({ id: 'b', topic: 'stellar blade' }),
    ]);

    expect(nodes.map((n) => n.topicKey)).toEqual([
      'wuthering waves',
      'stellar blade',
    ]);
  });

  it('groups by category as the cluster tier', () => {
    const nodes = buildEncyclopediaNodes([
      makeChunk({ id: 'a', category: 'games', topic: 'wuthering waves' }),
      makeChunk({ id: 'b', category: 'games', topic: 'stellar blade' }),
    ]);

    expect(nodes.map((n) => n.clusterKey)).toEqual(['games', 'games']);
  });

  it('uses the topic as the label', () => {
    const nodes = buildEncyclopediaNodes([
      makeChunk({ id: 'a', title: 'Article title', topic: 'wuthering waves' }),
    ]);

    expect(nodes[0].label).toBe('wuthering waves');
  });

  it('carries a short verbatim capture as the tooltip summary', () => {
    const nodes = buildEncyclopediaNodes([
      makeChunk({ id: 'a', content: 'x'.repeat(300) }),
    ]);

    expect(nodes[0].summary?.length).toBeLessThanOrEqual(141);
    expect(nodes[0].summary).toContain('…');
  });

  it('carries category, topic, domain and url as co-occurrence keys', () => {
    const nodes = buildEncyclopediaNodes([
      makeChunk({ id: 'a', category: 'games', topic: 'wuthering waves' }),
    ]);

    expect(nodes[0].keys).toEqual([
      'games',
      'wuthering waves',
      'example.com',
      'https://example.com/a',
    ]);
  });

  it('groups chunks with a missing topic and domain under unknown', () => {
    const nodes = buildEncyclopediaNodes([makeChunk({ id: 'a', domain: '' })]);

    expect(nodes[0].topicKey).toBe('unknown');
  });
});
