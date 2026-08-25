import { describe, expect, it } from 'vitest';

import type { ConstellationLink } from '../MemoryConstellation.types';
import { buildInterEdges } from './build-inter-edges.helper';

const clusters = [
  { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
  { key: 'y', label: 'y', color: '#000', memberIds: ['c', 'd'] },
  { key: 'z', label: 'z', color: '#000', memberIds: ['e'] },
];

const makeLink = (
  source: string,
  target: string,
  score: number,
): ConstellationLink => ({ source, target, type: 'semantic', score });

const communities = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberClusterKeys: ['x', 'y'],
    memberIds: ['a', 'b', 'c', 'd'],
  },
];

describe('buildInterEdges', () => {
  it('aggregates cross-cluster links into one hub edge with the max score', () => {
    const links = [makeLink('b', 'c', 0.6), makeLink('b', 'd', 0.9)];
    const edges = buildInterEdges(clusters, links, new Set(), [], 0.5);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({
      source: 'a',
      target: 'c',
      kind: 'inter',
      score: 0.9,
    });
  });

  it('drops links below the minimum score before aggregation', () => {
    const links = [makeLink('b', 'c', 0.55), makeLink('a', 'e', 0.8)];
    const edges = buildInterEdges(clusters, links, new Set(), [], 0.7);

    // x↔y at 0.55 is gone; x↔z at 0.8 survives.
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'a', target: 'e', score: 0.8 });
  });

  it('treats a missing score as below the bar', () => {
    const links: ConstellationLink[] = [
      { source: 'b', target: 'c', type: 'semantic' },
    ];
    expect(buildInterEdges(clusters, links, new Set(), [], 0.7)).toEqual([]);
  });

  it('skips links inside one cluster', () => {
    const links = [makeLink('a', 'b', 0.9)];
    expect(buildInterEdges(clusters, links, new Set(), [], 0.5)).toEqual([]);
  });

  it('emits a sibling edge for same-community pairs', () => {
    const links = [makeLink('b', 'c', 0.9)];
    const edges = buildInterEdges(clusters, links, new Set(), communities, 0.5);

    // x and y share the games community → a direct sibling edge.
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      source: 'a',
      target: 'c',
      kind: 'sibling',
    });
  });

  it('keeps cross-community edges', () => {
    const links = [makeLink('b', 'e', 0.9)];
    const edges = buildInterEdges(clusters, links, new Set(), communities, 0.5);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'a', target: 'e' });
  });

  it('uses the category dot as the hub for a collapsed cluster', () => {
    const links = [makeLink('b', 'e', 0.7)];
    const edges = buildInterEdges(clusters, links, new Set(['x']), [], 0.5);

    expect(edges[0]?.source).toBe('cluster:x');
  });

  it('marks the edge suggested when a contributing link is topical', () => {
    const links: ConstellationLink[] = [
      {
        source: 'b',
        target: 'e',
        type: 'semantic',
        score: 0.8,
        suggested: true,
      },
    ];
    const edges = buildInterEdges(clusters, links, new Set(), [], 0.5);

    expect(edges[0]).toMatchObject({
      source: 'a',
      target: 'e',
      suggested: true,
    });
  });
});
