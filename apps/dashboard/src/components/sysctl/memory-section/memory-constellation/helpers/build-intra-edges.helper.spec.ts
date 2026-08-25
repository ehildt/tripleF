import { describe, expect, it } from 'vitest';

import { buildIntraEdges } from './build-intra-edges.helper';

const clusters = [
  { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b', 'c'] },
  { key: 'y', label: 'y', color: '#000', memberIds: ['d'] },
];

describe('buildIntraEdges', () => {
  it('connects every leaf to its cluster first member', () => {
    const edges = buildIntraEdges(clusters, new Set());

    expect(edges).toEqual([
      { source: 'a', target: 'b', kind: 'intra' },
      { source: 'a', target: 'c', kind: 'intra' },
    ]);
  });

  it('skips collapsed clusters entirely', () => {
    expect(buildIntraEdges(clusters, new Set(['x']))).toEqual([]);
  });
});
