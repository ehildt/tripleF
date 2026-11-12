import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { buildIntraEdges } from './build-intra-edges.helper';

const topics = [
  { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b', 'c'] },
  { key: 'y', label: 'y', color: '#000', memberIds: ['d'] },
];

describe('buildIntraEdges', () => {
  it('connects every leaf to its topic first member', () => {
    const edges = buildIntraEdges(topics, new Set());

    expect(edges).toEqual([
      { source: 'a', target: 'b', kind: 'intra' },
      { source: 'a', target: 'c', kind: 'intra' },
    ]);
  });

  it('skips collapsed topics entirely', () => {
    expect(buildIntraEdges(topics, new Set(['x']))).toEqual([]);
  });

  it('connects every member to the synthetic title dot under the main-node regime', () => {
    const edges = buildIntraEdges(topics, new Set(), true);

    expect(edges).toEqual([
      { source: 'topic:x', target: 'a', kind: 'intra' },
      { source: 'topic:x', target: 'b', kind: 'intra' },
      { source: 'topic:x', target: 'c', kind: 'intra' },
      { source: 'topic:y', target: 'd', kind: 'intra' },
    ]);
  });

  it('skips collapsed topics under the main-node regime too', () => {
    expect(buildIntraEdges(topics, new Set(['x']), true)).toEqual([
      { source: 'topic:y', target: 'd', kind: 'intra' },
    ]);
  });

  it('routes visible classified leaves through their node tiers', () => {
    const nodeById = new Map<string, ConstellationNode>([
      [
        'a',
        {
          id: 'a',
          label: 'a',
          topicKey: 'x',
          text: 'a',
          keys: [],
          node: 'alpha',
        },
      ],
      [
        'b',
        {
          id: 'b',
          label: 'b',
          topicKey: 'x',
          text: 'b',
          keys: [],
          node: 'alpha',
        },
      ],
      [
        'c',
        {
          id: 'c',
          label: 'c',
          topicKey: 'x',
          text: 'c',
          keys: [],
          node: 'beta',
        },
      ],
    ]);

    expect(
      buildIntraEdges(
        [topics[0]],
        new Set(),
        true,
        nodeById,
        new Set(['a', 'c']),
      ),
    ).toEqual([
      { source: 'topic:x', target: 'node:x:alpha', kind: 'intra' },
      { source: 'node:x:alpha', target: 'a', kind: 'intra' },
      { source: 'topic:x', target: 'node:x:beta', kind: 'intra' },
      { source: 'node:x:beta', target: 'c', kind: 'intra' },
    ]);
  });
});
