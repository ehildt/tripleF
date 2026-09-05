import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { layoutConstellation } from './layout-constellation.helper';
import { topicNodes } from './topic-nodes.helper';

const makeNode = (id: string, topicKey: string): ConstellationNode =>
  ({ id, topicKey, label: id, text: id, keys: [] }) as ConstellationNode;

describe('layoutConstellation', () => {
  it('positions every node and centroid in 3D', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'y')];
    const topics = topicNodes(nodes);

    const layout = layoutConstellation(nodes, topics);

    expect(layout.positions.size).toBe(3);
    expect(layout.centroids.size).toBe(2);
    for (const pos of layout.positions.values()) {
      expect(typeof pos.z).toBe('number');
    }
  });

  it('spreads topic centroids along the z axis', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'y'), makeNode('c', 'z')];
    const topics = topicNodes(nodes);

    const layout = layoutConstellation(nodes, topics);

    const zs = [...layout.centroids.values()].map((c) => c.z);
    expect(new Set(zs).size).toBe(3);
  });

  it('is deterministic for the same input', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const topics = topicNodes(nodes);

    const first = layoutConstellation(nodes, topics);
    const second = layoutConstellation(nodes, topics);

    expect(first.positions.get('a')).toEqual(second.positions.get('a'));
    expect(first.centroids.get('x')).toEqual(second.centroids.get('x'));
  });

  it('places anchored nodes and their topic at the origin', () => {
    const nodes = [
      makeNode('hub', 'profile'),
      makeNode('a', 'x'),
      makeNode('b', 'x'),
    ];
    nodes[0].anchorToOrigin = true;
    const topics = topicNodes(nodes);

    const layout = layoutConstellation(nodes, topics);

    expect(layout.positions.get('hub')).toEqual({ x: 0, y: 0, z: 0 });
    expect(layout.centroids.get('profile')).toEqual({ x: 0, y: 0, z: 0 });
    expect(layout.centroids.get('x')).not.toEqual({ x: 0, y: 0, z: 0 });
  });

  it('handles an empty node list', () => {
    const layout = layoutConstellation([], []);

    expect(layout.positions.size).toBe(0);
    expect(layout.centroids.size).toBe(0);
  });
});
