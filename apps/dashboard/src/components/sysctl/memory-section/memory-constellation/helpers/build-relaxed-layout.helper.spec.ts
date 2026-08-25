import { describe, expect, it } from 'vitest';

import type {
  ConstellationLink,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { buildRelaxedLayout } from './build-relaxed-layout.helper';
import { clusterNodes } from './cluster-nodes.helper';

const makeNode = (
  id: string,
  clusterKey: string,
  communityKey?: string,
): ConstellationNode => ({
  id,
  label: id,
  clusterKey,
  text: id,
  keys: [clusterKey],
  communityKey,
});

const makeLink = (
  source: string,
  target: string,
  score: number,
): ConstellationLink => ({ source, target, type: 'semantic', score });

describe('buildRelaxedLayout', () => {
  it('clusters the nodes and relaxes a position for every member', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.clusters.map((c) => c.key)).toEqual(['x']);
    expect(layout.positions.get('a')).toBeDefined();
    expect(layout.positions.get('b')).toBeDefined();
  });

  it('seeds and relaxes one community hub between its member clusters', () => {
    const nodes = [
      makeNode('a', 'nte', 'games'),
      makeNode('b', 'nte', 'games'),
      makeNode('c', 'waves', 'games'),
    ];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.communities).toHaveLength(1);
    expect(layout.communities[0]?.key).toBe('games');
    expect(layout.positions.get('community:games')).toBeDefined();
  });

  it('creates a community hub even for a single cluster', () => {
    const nodes = [
      makeNode('a', 'nte', 'games'),
      makeNode('b', 'nte', 'games'),
    ];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.communities).toHaveLength(1);
    expect(layout.communities[0]?.key).toBe('games');
    expect(layout.positions.has('community:games')).toBe(true);
  });

  it('is deterministic for a given (nodes, links) pair', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'y')];
    const links = [makeLink('a', 'c', 0.8)];
    const first = buildRelaxedLayout(nodes, links);
    const second = buildRelaxedLayout(nodes, links);

    expect(first.positions).toEqual(second.positions);
  });

  it('groups by clusterKey in first-seen order', () => {
    const nodes = [makeNode('a', 'y'), makeNode('b', 'x')];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.clusters.map((c) => c.key)).toEqual(['y', 'x']);
    expect(clusterNodes(nodes).map((c) => c.key)).toEqual(['y', 'x']);
  });

  it('excludes weak inter links from the force pass', () => {
    const nodes = [
      makeNode('a', 'x'),
      makeNode('b', 'y'),
      makeNode('c', 'x'),
      makeNode('d', 'y'),
    ];
    const weak = [makeLink('a', 'd', 0.55)];
    const withWeak = buildRelaxedLayout(nodes, weak, 0.7);
    const without = buildRelaxedLayout(nodes, [], 0.7);

    // A sub-threshold link must not influence the layout at all.
    expect(withWeak.positions).toEqual(without.positions);
  });
});
