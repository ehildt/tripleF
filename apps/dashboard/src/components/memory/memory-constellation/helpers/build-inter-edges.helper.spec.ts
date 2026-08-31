import { describe, expect, it } from 'vitest';

import type { ConstellationLink } from '../MemoryConstellation.types';
import { buildInterEdges } from './build-inter-edges.helper';

const topics = [
  { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
  { key: 'y', label: 'y', color: '#000', memberIds: ['c', 'd'] },
  { key: 'z', label: 'z', color: '#000', memberIds: ['e'] },
];

const makeLink = (
  source: string,
  target: string,
  score: number,
): ConstellationLink => ({ source, target, type: 'semantic', score });

const clusters = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberTopicKeys: ['x', 'y'],
    memberIds: ['a', 'b', 'c', 'd'],
  },
];

describe('buildInterEdges', () => {
  it('aggregates cross-topic links into one hub edge with the max score', () => {
    const links = [makeLink('b', 'c', 0.6), makeLink('b', 'd', 0.9)];
    const edges = buildInterEdges(topics, links, new Set(), [], 0.5);

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
    const edges = buildInterEdges(topics, links, new Set(), [], 0.7);

    // x↔y at 0.55 is gone; x↔z at 0.8 survives.
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'a', target: 'e', score: 0.8 });
  });

  it('treats a missing score as below the bar', () => {
    const links: ConstellationLink[] = [
      { source: 'b', target: 'c', type: 'semantic' },
    ];
    expect(buildInterEdges(topics, links, new Set(), [], 0.7)).toEqual([]);
  });

  it('skips links inside one topic', () => {
    const links = [makeLink('a', 'b', 0.9)];
    expect(buildInterEdges(topics, links, new Set(), [], 0.5)).toEqual([]);
  });

  it('emits a sibling edge for same-cluster pairs', () => {
    const links = [makeLink('b', 'c', 0.9)];
    const edges = buildInterEdges(topics, links, new Set(), clusters, 0.5);

    // x and y share the games cluster → a direct sibling edge.
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      source: 'a',
      target: 'c',
      kind: 'sibling',
    });
  });

  it('keeps cross-cluster edges', () => {
    const links = [makeLink('b', 'e', 0.9)];
    const edges = buildInterEdges(topics, links, new Set(), clusters, 0.5);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'a', target: 'e' });
  });

  it('uses the category dot as the hub for a collapsed topic', () => {
    const links = [makeLink('b', 'e', 0.7)];
    const edges = buildInterEdges(topics, links, new Set(['x']), [], 0.5);

    expect(edges[0]?.source).toBe('topic:x');
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
    const edges = buildInterEdges(topics, links, new Set(), [], 0.5);

    expect(edges[0]).toMatchObject({
      source: 'a',
      target: 'e',
      suggested: true,
    });
  });
});
