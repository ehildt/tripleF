import { describe, expect, it } from 'vitest';

import type { LexiconChunkRecord } from '@/api/memory.api';

import { buildLexiconNodes } from './build-lexicon-nodes.helper';

const makeChunk = (
  overrides: Partial<LexiconChunkRecord>,
): LexiconChunkRecord =>
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
  }) as LexiconChunkRecord;

describe('buildLexiconNodes', () => {
  it('clusters by source domain', () => {
    const nodes = buildLexiconNodes([
      makeChunk({ id: 'a', domain: 'example.com' }),
      makeChunk({ id: 'b', domain: 'other.org' }),
    ]);

    expect(nodes.map((n) => n.clusterKey)).toEqual([
      'example.com',
      'other.org',
    ]);
  });

  it('uses the domain as the label', () => {
    const nodes = buildLexiconNodes([
      makeChunk({ id: 'a', title: 'Article title', domain: 'example.com' }),
    ]);

    expect(nodes[0].label).toBe('example.com');
  });

  it('carries a short verbatim capture as the tooltip summary', () => {
    const nodes = buildLexiconNodes([
      makeChunk({ id: 'a', content: 'x'.repeat(300) }),
    ]);

    expect(nodes[0].summary?.length).toBeLessThanOrEqual(141);
    expect(nodes[0].summary).toContain('…');
  });

  it('carries domain and url as co-occurrence keys', () => {
    const nodes = buildLexiconNodes([makeChunk({ id: 'a' })]);

    expect(nodes[0].keys).toEqual(['example.com', 'https://example.com/a']);
  });

  it('groups chunks with a missing domain under unknown', () => {
    const nodes = buildLexiconNodes([makeChunk({ id: 'a', domain: '' })]);

    expect(nodes[0].clusterKey).toBe('unknown');
  });
});
