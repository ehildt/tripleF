import { describe, expect, it } from 'vitest';

import type {
  ConstellationCommunity,
  ConstellationLink,
} from '../MemoryConstellation.types';
import { buildEdges } from './build-edges.helper';

const clusters = [
  { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
  { key: 'y', label: 'y', color: '#000', memberIds: ['c', 'd'] },
];

const communities: ConstellationCommunity[] = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberClusterKeys: ['x'],
    memberIds: ['a', 'b'],
  },
];

describe('buildEdges', () => {
  it('builds intra, inter, and community edges together', () => {
    const links: ConstellationLink[] = [
      { source: 'b', target: 'c', type: 'semantic', score: 0.7 },
    ];
    const edges = buildEdges(clusters, links, new Set(), communities, 0.5);

    const intra = edges.filter((e) => e.kind === 'intra');
    const inter = edges.filter((e) => e.kind === 'inter');
    const community = edges.filter((e) => e.kind === 'community');
    expect(intra).toHaveLength(2); // a→b, c→d
    expect(inter).toHaveLength(1); // a→c
    expect(community).toEqual([
      { source: 'a', target: 'community:games', kind: 'community' },
    ]);
  });

  it('passes the minimum score through to the inter pass', () => {
    const links: ConstellationLink[] = [
      { source: 'b', target: 'c', type: 'semantic', score: 0.6 },
    ];
    const edges = buildEdges(clusters, links, new Set(), [], 0.7);

    expect(edges.filter((e) => e.kind === 'inter')).toEqual([]);
  });
});
