import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { clusterNodes } from './cluster-nodes.helper';

const makeNode = (id: string, clusterKey: string): ConstellationNode =>
  ({ id, clusterKey, label: id, text: id, keys: [] }) as ConstellationNode;

describe('clusterNodes', () => {
  it('groups nodes by clusterKey in first-seen order', () => {
    const nodes = [
      makeNode('a', 'work'),
      makeNode('b', 'rust'),
      makeNode('c', 'work'),
    ];

    const clusters = clusterNodes(nodes);

    expect(clusters.map((c) => c.key)).toEqual(['work', 'rust']);
    expect(clusters[0].memberIds).toEqual(['a', 'c']);
    expect(clusters[1].memberIds).toEqual(['b']);
  });

  it('assigns a color to every cluster', () => {
    const clusters = clusterNodes([makeNode('a', 'x'), makeNode('b', 'y')]);

    expect(clusters.every((c) => c.color.startsWith('#'))).toBe(true);
  });

  it('returns an empty array for no nodes', () => {
    expect(clusterNodes([])).toEqual([]);
  });
});
