import { describe, expect, it } from 'vitest';

import type { MemoryFactRecord } from '@/api/memory.api';

import { buildPartitionNodes } from './build-partition-nodes.helper';

const makeFact = (overrides: Partial<MemoryFactRecord>): MemoryFactRecord =>
  ({ id: 'f', text: 'text', ...overrides }) as MemoryFactRecord;

describe('buildPartitionNodes', () => {
  it('clusters by the primary tag', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', text: 'one', tags: ['work', 'rust'] }),
      makeFact({ id: 'b', text: 'two', tags: ['work'] }),
    ]);

    expect(nodes.map((n) => n.clusterKey)).toEqual(['work', 'work']);
  });

  it('groups untagged facts under the untagged cluster', () => {
    const nodes = buildPartitionNodes([makeFact({ id: 'a', tags: [] })]);

    expect(nodes[0].clusterKey).toBe('untagged');
  });

  it('carries all tags as co-occurrence keys', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', tags: ['work', 'rust'] }),
    ]);

    expect(nodes[0].keys).toEqual(['work', 'rust']);
  });

  it('uses the primary tag as the label', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', text: 'x'.repeat(100), tags: ['work'] }),
    ]);

    expect(nodes[0].label).toBe('work');
  });

  it('maps the broad category to the community key', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', tags: ['nte'], category: 'games' }),
      makeFact({ id: 'b', tags: ['wuthering waves'], category: 'games' }),
      makeFact({ id: 'c', tags: ['dog'] }),
    ]);

    expect(nodes[0]?.communityKey).toBe('games');
    expect(nodes[1]?.communityKey).toBe('games');
    expect(nodes[2]?.communityKey).toBeUndefined();
  });

  it('treats a blank category as absent', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', tags: ['nte'], category: '   ' }),
    ]);

    expect(nodes[0]?.communityKey).toBeUndefined();
  });
});
