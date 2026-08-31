import { describe, expect, it } from 'vitest';

import { buildClusterEdges } from './build-cluster-edges.helper';

const topics = [
  { key: 'nte', label: 'nte', color: '#000', memberIds: ['a', 'b'] },
  { key: 'dog', label: 'dog', color: '#000', memberIds: ['c'] },
];

const clusters = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberTopicKeys: ['nte'],
    memberIds: ['a', 'b'],
  },
];

describe('buildClusterEdges', () => {
  it('connects each member topic hub to its cluster node', () => {
    const edges = buildClusterEdges(topics, clusters, new Set());

    expect(edges).toEqual([
      { source: 'a', target: 'cluster:games', kind: 'cluster' },
    ]);
  });

  it('uses the category dot when the member topic is collapsed', () => {
    const edges = buildClusterEdges(topics, clusters, new Set(['nte']));

    expect(edges[0]?.source).toBe('topic:nte');
  });

  it('skips unknown topic keys', () => {
    expect(
      buildClusterEdges(
        topics,
        [
          {
            ...clusters[0]!,
            memberTopicKeys: ['ghost'],
          },
        ],
        new Set(),
      ),
    ).toEqual([]);
  });
});
