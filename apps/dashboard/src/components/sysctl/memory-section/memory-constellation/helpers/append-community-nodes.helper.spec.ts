import { describe, expect, it } from 'vitest';

import type { VisibleAccumulator } from '../MemoryConstellation.types';
import { appendCommunityNodes } from './append-community-nodes.helper';

const communities = [
  {
    key: 'games',
    label: 'games',
    color: '#f97316',
    memberClusterKeys: ['nte', 'waves'],
    memberIds: ['a', 'b', 'c'],
  },
];

describe('appendCommunityNodes', () => {
  it('appends one always-visible hub per community at its relaxed position', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendCommunityNodes(
      communities,
      new Map([['community:games', { x: 5, y: 0, z: 0 }]]),
      acc,
    );

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0]).toMatchObject({
      id: 'community:games',
      isCommunity: true,
    });
    expect(acc.nodeIndex.get('community:games')).toBe(0);
    expect(acc.positions.get('community:games')).toEqual({ x: 5, y: 0, z: 0 });
  });

  it('omits the position when the community has no relaxed seed', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendCommunityNodes(communities, new Map(), acc);

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.positions.has('community:games')).toBe(false);
  });
});
