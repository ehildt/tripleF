import { describe, expect, it } from 'vitest';

import type { ConstellationCluster } from '../MemoryConstellation.types';
import { buildClusterNode } from './build-cluster-node.helper';

const cluster: ConstellationCluster = {
  key: 'games',
  label: 'games',
  color: '#f97316',
  memberTopicKeys: ['nte', 'wuthering waves'],
  memberIds: ['a', 'b', 'c'],
};

describe('buildClusterNode', () => {
  it('builds a labeled synthetic hub with topic and record counts', () => {
    const node = buildClusterNode(cluster);

    expect(node).toMatchObject({
      id: 'cluster:games',
      label: 'games',
      topicKey: 'games',
      clusterKey: 'games',
      isCluster: true,
    });
    expect(node.summary).toBe('2 topics · 3 records');
    expect(node.meta).toEqual([
      { label: 'category', value: 'games' },
      { label: 'topics', value: '2' },
      { label: 'records', value: '3' },
    ]);
  });

  it('uses singular words for a single-member cluster', () => {
    const node = buildClusterNode({
      ...cluster,
      memberTopicKeys: ['nte'],
      memberIds: ['a'],
    });

    expect(node.summary).toBe('1 topic · 1 record');
  });

  it('appends the leaf rollup (without duplicating records) when members are known', () => {
    const nodeById = new Map(
      cluster.memberIds.map((id) => [
        id,
        {
          id,
          label: id,
          topicKey: 'nte',
          text: id,
          keys: [],
          domain: id === 'a' ? 'youtube.com' : 'reddit.com',
          url: `https://${id}.example.com`,
          timestamp: '2026-09-02T00:00:00Z',
        },
      ]),
    );

    const node = buildClusterNode(cluster, nodeById, []);

    expect(node.meta).toContainEqual({ label: 'records', value: '3' });
    expect(node.meta?.filter((row) => row.label === 'records')).toHaveLength(1);
    expect(node.meta).toContainEqual({
      label: 'sources',
      value: '2 domains · 3 urls',
    });
    expect(node.meta).toContainEqual({ label: 'updated', value: '2026-09-02' });
  });
});
