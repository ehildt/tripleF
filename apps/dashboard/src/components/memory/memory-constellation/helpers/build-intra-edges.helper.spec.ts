import { describe, expect, it } from 'vitest';

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
});
