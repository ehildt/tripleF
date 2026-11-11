import { describe, expect, it } from 'vitest';

import type { ConstellationCluster } from '../MemoryConstellation.types';
import { buildClusterSeed } from './build-cluster-seed.helper';

describe('buildClusterSeed', () => {
  it('combines community seeds with only community-less topic centroids', () => {
    const cluster: ConstellationCluster = {
      key: 'games',
      label: 'Games',
      color: '#ff0000',
      memberTopicKeys: ['nte', 'dog'],
      memberCommunityKeys: ['survival-games'],
      memberIds: ['a', 'b'],
    };
    const communityIdByTopic = new Map([['nte', 'survival-games']]);
    const centroids = new Map([
      ['nte', { x: 100, y: 100, z: 100 }],
      ['dog', { x: 30, y: 40, z: 50 }],
    ]);
    const seed = new Map([
      ['community:survival-games', { x: 10, y: 20, z: 30 }],
    ]);

    expect(
      buildClusterSeed(cluster, communityIdByTopic, centroids, seed),
    ).toEqual({ x: 20, y: 30, z: 40 });
  });
});
