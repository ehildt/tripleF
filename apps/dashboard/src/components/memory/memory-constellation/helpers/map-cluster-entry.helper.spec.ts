import { describe, expect, it } from 'vitest';

import { mapClusterEntry } from './map-cluster-entry.helper';

describe('mapClusterEntry', () => {
  it('builds a cluster hub from a key/topic-keys pair', () => {
    expect(
      mapClusterEntry(
        ['games', ['c1', 'c2']],
        0,
        new Map([['games', ['n1', 'n2']]]),
      ),
    ).toEqual({
      key: 'games',
      label: 'games',
      color: '#f97316',
      memberTopicKeys: ['c1', 'c2'],
      memberCommunityKeys: [],
      memberIds: ['n1', 'n2'],
    });
  });
});
