import { describe, expect, it } from 'vitest';

import type { VisibleAccumulator } from '../MemoryConstellation.types';
import { appendClusterNodes } from './append-cluster-nodes.helper';

const clusters = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberTopicKeys: ['nte', 'waves'],
    memberIds: ['a', 'b', 'c'],
  },
];

describe('appendClusterNodes', () => {
  it('appends one always-visible hub per cluster at its relaxed position', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendClusterNodes(
      clusters,
      new Map([['cluster:games', { x: 5, y: 0, z: 0 }]]),
      acc,
    );

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0]).toMatchObject({
      id: 'cluster:games',
      isCluster: true,
    });
    expect(acc.nodeIndex.get('cluster:games')).toBe(0);
    expect(acc.positions.get('cluster:games')).toEqual({ x: 5, y: 0, z: 0 });
  });

  it('omits the position when the cluster has no relaxed seed', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendClusterNodes(clusters, new Map(), acc);

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.positions.has('cluster:games')).toBe(false);
  });
});
