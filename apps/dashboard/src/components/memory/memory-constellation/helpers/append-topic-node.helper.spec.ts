import { describe, expect, it } from 'vitest';

import type { VisibleAccumulator } from '../MemoryConstellation.types';
import { appendTopicNode } from './append-topic-node.helper';

const makeAcc = (): VisibleAccumulator => ({
  visibleNodes: [],
  positions: new Map(),
  nodeIndex: new Map(),
});

describe('appendTopicNode', () => {
  it('appends a synthetic category dot with its member count', () => {
    const acc = makeAcc();
    appendTopicNode(
      { key: 'work', label: 'work', color: '#000', memberIds: ['a', 'b'] },
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 4, y: 0, z: 0 }],
      ]),
      acc,
    );

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0]).toMatchObject({
      id: 'topic:work',
      label: 'work',
      topicKey: 'work',
      isTopic: true,
      memberCount: 2,
    });
    expect(acc.nodeIndex.get('topic:work')).toBe(0);
  });

  it('places the dot at the members relaxed centroid', () => {
    const acc = makeAcc();
    appendTopicNode(
      { key: 'work', label: 'work', color: '#000', memberIds: ['a', 'b'] },
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 4, y: 0, z: 0 }],
      ]),
      acc,
    );

    expect(acc.positions.get('topic:work')).toEqual({ x: 2, y: 0, z: 0 });
  });

  it('omits the position when no member is relaxed', () => {
    const acc = makeAcc();
    appendTopicNode(
      { key: 'work', label: 'work', color: '#000', memberIds: ['a'] },
      new Map(),
      acc,
    );

    expect(acc.positions.has('topic:work')).toBe(false);
  });

  it('carries the leaf rollup when the member lookup is provided', () => {
    const acc = makeAcc();
    appendTopicNode(
      { key: 'nte', label: 'nte', color: '#000', memberIds: ['a', 'b'] },
      new Map(),
      acc,
      new Map([
        [
          'a',
          {
            id: 'a',
            label: 'a',
            topicKey: 'nte',
            text: 'a',
            keys: [],
            domain: 'youtube.com',
            url: 'https://youtu.be/1',
            timestamp: '2026-09-01T00:00:00Z',
          },
        ],
        [
          'b',
          {
            id: 'b',
            label: 'b',
            topicKey: 'nte',
            text: 'b',
            keys: [],
            domain: 'reddit.com',
            url: 'https://reddit.com/b',
            timestamp: '2026-09-02T00:00:00Z',
          },
        ],
      ]),
      [],
    );

    expect(acc.visibleNodes[0].summary).toBe('2 records · 2 sources');
    expect(acc.visibleNodes[0].text).toContain('click to toggle');
    expect(acc.visibleNodes[0].meta).toContainEqual({
      label: 'sources',
      value: '2 domains · 2 urls',
    });
  });
});
