import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { topicNodes } from './topic-nodes.helper';

const makeNode = (id: string, topicKey: string): ConstellationNode =>
  ({ id, topicKey, label: id, text: id, keys: [] }) as ConstellationNode;

describe('topicNodes', () => {
  it('groups nodes by topicKey in first-seen order', () => {
    const nodes = [
      makeNode('a', 'work'),
      makeNode('b', 'rust'),
      makeNode('c', 'work'),
    ];

    const topics = topicNodes(nodes);

    expect(topics.map((c) => c.key)).toEqual(['work', 'rust']);
    expect(topics[0].memberIds).toEqual(['a', 'c']);
    expect(topics[1].memberIds).toEqual(['b']);
  });

  it('assigns a color to every topic', () => {
    const topics = topicNodes([makeNode('a', 'x'), makeNode('b', 'y')]);

    expect(topics.every((c) => c.color.startsWith('#'))).toBe(true);
  });

  it('returns an empty array for no nodes', () => {
    expect(topicNodes([])).toEqual([]);
  });
});
