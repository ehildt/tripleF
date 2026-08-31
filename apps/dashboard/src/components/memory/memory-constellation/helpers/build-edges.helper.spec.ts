import { describe, expect, it } from 'vitest';

import type {
  ConstellationCluster,
  ConstellationLink,
} from '../MemoryConstellation.types';
import { buildEdges } from './build-edges.helper';

const topics = [
  { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
  { key: 'y', label: 'y', color: '#000', memberIds: ['c', 'd'] },
];

const clusters: ConstellationCluster[] = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberTopicKeys: ['x'],
    memberIds: ['a', 'b'],
  },
];

describe('buildEdges', () => {
  it('builds intra, inter, and cluster edges together', () => {
    const links: ConstellationLink[] = [
      { source: 'b', target: 'c', type: 'semantic', score: 0.7 },
    ];
    const edges = buildEdges(topics, links, new Set(), clusters, 0.5);

    const intra = edges.filter((e) => e.kind === 'intra');
    const inter = edges.filter((e) => e.kind === 'inter');
    const cluster = edges.filter((e) => e.kind === 'cluster');
    expect(intra).toHaveLength(2); // a→b, c→d
    expect(inter).toHaveLength(1); // a→c
    expect(cluster).toEqual([
      { source: 'a', target: 'cluster:games', kind: 'cluster' },
    ]);
  });

  it('passes the minimum score through to the inter pass', () => {
    const links: ConstellationLink[] = [
      { source: 'b', target: 'c', type: 'semantic', score: 0.6 },
    ];
    const edges = buildEdges(topics, links, new Set(), [], 0.7);

    expect(edges.filter((e) => e.kind === 'inter')).toEqual([]);
  });
});
