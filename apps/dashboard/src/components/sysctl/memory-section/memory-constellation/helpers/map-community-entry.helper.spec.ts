import { describe, expect, it } from 'vitest';

import { mapCommunityEntry } from './map-community-entry.helper';

describe('mapCommunityEntry', () => {
  it('builds a community hub from a key/cluster-keys pair', () => {
    expect(
      mapCommunityEntry(
        ['games', ['c1', 'c2']],
        0,
        new Map([['games', ['n1', 'n2']]]),
      ),
    ).toEqual({
      key: 'games',
      label: 'games',
      color: '#f97316',
      memberClusterKeys: ['c1', 'c2'],
      memberIds: ['n1', 'n2'],
    });
  });
});
