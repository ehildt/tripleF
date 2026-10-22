import { describe, expect, it } from 'vitest';

import type {
  ConstellationCommunity,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { appendCommunityNodes } from './append-community-nodes.helper';

describe('appendCommunityNodes', () => {
  const community: ConstellationCommunity = {
    key: 'survival-games',
    label: 'Survival games',
    color: '#c00',
    clusterKey: 'games',
    memberTopicKeys: ['fps'],
    memberIds: ['m1'],
  };

  it('appends one hub dot per community at its relaxed position', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendCommunityNodes(
      [community],
      new Map([['community:survival-games', { x: 1, y: 2, z: 3 }]]),
      acc,
    );
    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0].id).toBe('community:survival-games');
    expect(acc.nodeIndex.get('community:survival-games')).toBe(0);
    expect(acc.positions.get('community:survival-games')).toEqual({
      x: 1,
      y: 2,
      z: 3,
    });
  });

  it('appends dots without a position entry when none is relaxed', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendCommunityNodes([community], new Map(), acc);
    expect(acc.positions.size).toBe(0);
  });
});
