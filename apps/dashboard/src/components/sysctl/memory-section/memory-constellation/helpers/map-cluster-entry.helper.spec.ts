import { describe, expect, it } from 'vitest';

import { mapClusterEntry } from './map-cluster-entry.helper';

describe('mapClusterEntry', () => {
  it('builds a cluster blob from a key/member pair', () => {
    expect(mapClusterEntry(['games', ['n1', 'n2']], 0)).toEqual({
      key: 'games',
      label: 'games',
      color: '#8b5cf6',
      memberIds: ['n1', 'n2'],
    });
  });
});
