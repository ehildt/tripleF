import { describe, expect, it } from 'vitest';

import type {
  ConstellationLink,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { buildRelaxedLayout } from './build-relaxed-layout.helper';
import { topicNodes } from './topic-nodes.helper';

const makeNode = (
  id: string,
  topicKey: string,
  clusterKey?: string,
): ConstellationNode => ({
  id,
  label: id,
  topicKey,
  text: id,
  keys: [topicKey],
  clusterKey,
});

const makeLink = (
  source: string,
  target: string,
  score: number,
): ConstellationLink => ({ source, target, type: 'semantic', score });

describe('buildRelaxedLayout', () => {
  it('topics the nodes and relaxes a position for every member', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.topics.map((c) => c.key)).toEqual(['x']);
    expect(layout.positions.get('a')).toBeDefined();
    expect(layout.positions.get('b')).toBeDefined();
  });

  it('seeds and relaxes one cluster hub between its member topics', () => {
    const nodes = [
      makeNode('a', 'nte', 'games'),
      makeNode('b', 'nte', 'games'),
      makeNode('c', 'waves', 'games'),
    ];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.clusters).toHaveLength(1);
    expect(layout.clusters[0]?.key).toBe('games');
    expect(layout.positions.get('cluster:games')).toBeDefined();
  });

  it('creates a cluster hub even for a single topic', () => {
    const nodes = [
      makeNode('a', 'nte', 'games'),
      makeNode('b', 'nte', 'games'),
    ];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.clusters).toHaveLength(1);
    expect(layout.clusters[0]?.key).toBe('games');
    expect(layout.positions.has('cluster:games')).toBe(true);
  });

  it('is deterministic for a given (nodes, links) pair', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'y')];
    const links = [makeLink('a', 'c', 0.8)];
    const first = buildRelaxedLayout(nodes, links);
    const second = buildRelaxedLayout(nodes, links);

    expect(first.positions).toEqual(second.positions);
  });

  it('groups by topicKey in first-seen order', () => {
    const nodes = [makeNode('a', 'y'), makeNode('b', 'x')];
    const layout = buildRelaxedLayout(nodes, []);

    expect(layout.topics.map((c) => c.key)).toEqual(['y', 'x']);
    expect(topicNodes(nodes).map((c) => c.key)).toEqual(['y', 'x']);
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
