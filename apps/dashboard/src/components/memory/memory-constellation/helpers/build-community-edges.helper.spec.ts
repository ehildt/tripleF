import { describe, expect, it } from 'vitest';

import type {
  ConstellationCommunity,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { buildCommunityEdges } from './build-community-edges.helper';

describe('buildCommunityEdges', () => {
  it('connects each member topic to its community hub', () => {
    const topics: ConstellationTopic[] = [
      { key: 'fps', label: 'fps', color: '#c00', memberIds: ['m1', 'm2'] },
      {
        key: 'survival',
        label: 'survival',
        color: '#c00',
        memberIds: ['m3', 'm4'],
      },
    ];
    const communities: ConstellationCommunity[] = [
      {
        key: 'survival-games',
        label: 'survival-games',
        color: '#c00',
        clusterKey: 'games',
        memberTopicKeys: ['fps', 'survival'],
        memberIds: [],
      },
    ];

    // Multi-member topics collapse to their synthetic hubs.
    const collapsed = new Set(['fps', 'survival']);
    const edges = buildCommunityEdges(topics, communities, collapsed);

    expect(edges).toEqual([
      {
        source: 'topic:fps',
        target: 'community:survival-games',
        kind: 'community',
      },
      {
        source: 'topic:survival',
        target: 'community:survival-games',
        kind: 'community',
      },
    ]);
  });

  it('skips topics that were removed', () => {
    const communities: ConstellationCommunity[] = [
      {
        key: 'survival-games',
        label: 'survival-games',
        color: '#c00',
        clusterKey: 'games',
        memberTopicKeys: ['gone'],
        memberIds: [],
      },
    ];
    expect(buildCommunityEdges([], communities, new Set())).toEqual([]);
  });
});
