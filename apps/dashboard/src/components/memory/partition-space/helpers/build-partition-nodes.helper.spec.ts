import { describe, expect, it } from 'vitest';

import type { MemoryFactRecord } from '@/api/memory.api';

import { buildPartitionNodes } from './build-partition-nodes.helper';

const makeFact = (overrides: Partial<MemoryFactRecord>): MemoryFactRecord =>
  ({ id: 'f', text: 'text', ...overrides }) as MemoryFactRecord;

describe('buildPartitionNodes', () => {
  it('topics by the primary tag', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', text: 'one', tags: ['work', 'rust'] }),
      makeFact({ id: 'b', text: 'two', tags: ['work'] }),
    ]);

    expect(nodes.map((n) => n.topicKey)).toEqual(['work', 'work']);
  });

  it('groups untagged facts under the untagged topic', () => {
    const nodes = buildPartitionNodes([makeFact({ id: 'a', tags: [] })]);

    expect(nodes[0].topicKey).toBe('untagged');
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

  it('maps the broad category to the cluster key', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', tags: ['nte'], category: 'games' }),
      makeFact({ id: 'b', tags: ['wuthering waves'], category: 'games' }),
      makeFact({ id: 'c', tags: ['dog'] }),
    ]);

    expect(nodes[0]?.clusterKey).toBe('games');
    expect(nodes[1]?.clusterKey).toBe('games');
    expect(nodes[2]?.clusterKey).toBeUndefined();
  });

  it('treats a blank category as absent', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', tags: ['nte'], category: '   ' }),
    ]);

    expect(nodes[0]?.clusterKey).toBeUndefined();
  });

  it('resolves bridge evidence against the fact list', () => {
    const nodes = buildPartitionNodes([
      makeFact({ id: 'a', text: 'I am learning Rust', tags: ['work'] }),
      makeFact({
        id: 'b',
        text: 'I am rewriting the payments service',
        tags: ['work'],
      }),
      makeFact({
        id: 'b1',
        text: 'The user is migrating to Rust',
        tags: ['bridge'],
        evidenceIds: ['a', 'b'],
      }),
    ]);

    const bridge = nodes.find((node) => node.isBridge);
    expect(bridge?.evidenceTexts).toEqual([
      'I am learning Rust',
      'I am rewriting the payments service',
    ]);
  });
});
