import { describe, expect, it } from 'vitest';

import type { ConstellationCommunity } from '../MemoryConstellation.types';
import { buildCommunitySeed } from './build-community-seed.helper';

describe('buildCommunitySeed', () => {
  it('averages the available member-topic centroids', () => {
    const community: ConstellationCommunity = {
      key: 'survival-games',
      label: 'Survival games',
      color: '#ff0000',
      clusterKey: 'games',
      memberTopicKeys: ['nte', 'waves', 'missing'],
      memberIds: ['a', 'b'],
    };
    const centroids = new Map([
      ['nte', { x: 10, y: 20, z: 30 }],
      ['waves', { x: 20, y: 30, z: 40 }],
    ]);

    expect(buildCommunitySeed(community, centroids)).toEqual({
      x: 15,
      y: 25,
      z: 35,
    });
  });
});
