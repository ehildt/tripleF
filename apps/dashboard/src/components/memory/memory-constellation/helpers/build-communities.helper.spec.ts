import { describe, expect, it } from 'vitest';

import type {
  ConstellationCluster,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import {
  attachCommunitiesToClusters,
  buildCommunities,
} from './build-communities.helper';

function member(
  id: string,
  communityKey?: string,
  clusterKey?: string,
): ConstellationNode {
  return {
    id,
    label: id,
    topicKey: 't',
    text: id,
    keys: [],
    communityKey,
    clusterKey,
  } as ConstellationNode;
}

describe('buildCommunities', () => {
  const cluster: ConstellationCluster = {
    key: 'games',
    label: 'games',
    color: '#c00',
    memberTopicKeys: ['fps', 'survival'],
    memberCommunityKeys: [],
    memberIds: [],
  };

  it('groups topics under a community only when they also belong to the cluster', () => {
    const nodes = [
      member('a', 'survival-games', 'games'),
      member('b', 'survival-games', 'games'),
      // In the community but NOT the cluster — stays ungrouped
      member('c', 'survival-games', 'other'),
    ];
    const topics: ConstellationTopic[] = [
      { key: 'fps', label: 'fps', color: '#c00', memberIds: ['a'] },
      { key: 'survival', label: 'survival', color: '#c00', memberIds: ['b'] },
      { key: 'other-topic', label: 'other', color: '#c00', memberIds: ['c'] },
    ];

    const communities = buildCommunities(nodes, topics, [cluster]);

    expect(communities).toHaveLength(1);
    expect(communities[0].key).toBe('survival-games');
    expect(communities[0].clusterKey).toBe('games');
    expect(communities[0].color).toBe('#c00');
    expect(communities[0].memberTopicKeys).toEqual(['fps', 'survival']);
  });

  it('groups nothing when members carry no community key', () => {
    const nodes = [member('a', undefined, 'games')];
    const topics: ConstellationTopic[] = [
      { key: 'fps', label: 'fps', color: '#c00', memberIds: ['a'] },
    ];
    expect(buildCommunities(nodes, topics, [cluster])).toEqual([]);
  });

  it('inherits the parent cluster color', () => {
    const nodes = [member('a', 'survival-games', 'games')];
    const topics: ConstellationTopic[] = [
      { key: 'fps', label: 'fps', color: '#c00', memberIds: ['a'] },
    ];
    const slate = { ...cluster, color: '#123' };
    expect(buildCommunities(nodes, topics, [slate])[0].color).toBe('#123');
  });
});

describe('attachCommunitiesToClusters', () => {
  it('attaches community children keys to their parent cluster', () => {
    const [attached] = attachCommunitiesToClusters(
      [
        {
          key: 'games',
          label: 'games',
          color: '#c00',
          memberTopicKeys: [],
          memberCommunityKeys: [],
          memberIds: [],
        },
      ],
      [
        {
          key: 'survival-games',
          label: 'survival-games',
          color: '#c00',
          clusterKey: 'games',
          memberTopicKeys: [],
          memberIds: [],
        },
      ],
    );
    expect(attached.memberCommunityKeys).toEqual(['survival-games']);
  });
});
