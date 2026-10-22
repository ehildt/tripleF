import { describe, expect, it } from 'vitest';

import type { ConstellationCommunity } from '../MemoryConstellation.types';
import {
  buildCommunityNode,
  communityNodeId,
} from './build-community-node.helper';

describe('communityNodeId', () => {
  it('builds the synthetic hub id from the community key', () => {
    expect(communityNodeId('survival-games')).toBe('community:survival-games');
  });
});

describe('buildCommunityNode', () => {
  const community: ConstellationCommunity = {
    key: 'survival-games',
    label: 'Survival games',
    color: '#c00',
    clusterKey: 'games',
    memberTopicKeys: ['fps'],
    memberIds: ['m1', 'm2'],
  };

  it('builds the hub dot with topic/record counts in the tooltip text', () => {
    const node = buildCommunityNode(community);
    expect(node.id).toBe('community:survival-games');
    expect(node.isCommunity).toBe(true);
    expect(node.text).toContain('1 topic, 2 records');
    expect(node.memberCount).toBe(2);
    expect(node.meta).toContainEqual({ label: 'cluster', value: 'games' });
  });

  it('pluralizes the topic count', () => {
    const node = buildCommunityNode({
      ...community,
      memberTopicKeys: ['fps', 'survival'],
    });
    expect(node.text).toContain('2 topics');
  });
});
