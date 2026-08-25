import { describe, expect, it } from 'vitest';

import { buildCommunityEdges } from './build-community-edges.helper';

const clusters = [
  { key: 'nte', label: 'nte', color: '#000', memberIds: ['a', 'b'] },
  { key: 'dog', label: 'dog', color: '#000', memberIds: ['c'] },
];

const communities = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberClusterKeys: ['nte'],
    memberIds: ['a', 'b'],
  },
];

describe('buildCommunityEdges', () => {
  it('connects each member cluster hub to its community node', () => {
    const edges = buildCommunityEdges(clusters, communities, new Set());

    expect(edges).toEqual([
      { source: 'a', target: 'community:games', kind: 'community' },
    ]);
  });

  it('uses the category dot when the member cluster is collapsed', () => {
    const edges = buildCommunityEdges(clusters, communities, new Set(['nte']));

    expect(edges[0]?.source).toBe('cluster:nte');
  });

  it('skips unknown cluster keys', () => {
    expect(
      buildCommunityEdges(
        clusters,
        [
          {
            ...communities[0]!,
            memberClusterKeys: ['ghost'],
          },
        ],
        new Set(),
      ),
    ).toEqual([]);
  });
});
