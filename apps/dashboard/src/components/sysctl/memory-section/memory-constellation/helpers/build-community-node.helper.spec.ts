import { describe, expect, it } from 'vitest';

import type { ConstellationCommunity } from '../MemoryConstellation.types';
import { buildCommunityNode } from './build-community-node.helper';

const community: ConstellationCommunity = {
  key: 'games',
  label: 'games',
  color: '#f97316',
  memberClusterKeys: ['nte', 'wuthering waves'],
  memberIds: ['a', 'b', 'c'],
};

describe('buildCommunityNode', () => {
  it('builds a labeled synthetic hub with topic and record counts', () => {
    const node = buildCommunityNode(community);

    expect(node).toMatchObject({
      id: 'community:games',
      label: 'games',
      clusterKey: 'games',
      communityKey: 'games',
      isCommunity: true,
    });
    expect(node.summary).toBe('2 topics · 3 records');
    expect(node.meta).toEqual([
      { label: 'category', value: 'games' },
      { label: 'topics', value: '2' },
      { label: 'records', value: '3' },
    ]);
  });

  it('uses singular words for a single-member community', () => {
    const node = buildCommunityNode({
      ...community,
      memberClusterKeys: ['nte'],
      memberIds: ['a'],
    });

    expect(node.summary).toBe('1 topic · 1 record');
  });
});
