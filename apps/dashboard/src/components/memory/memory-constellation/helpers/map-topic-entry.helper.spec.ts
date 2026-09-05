import { describe, expect, it } from 'vitest';

import { mapTopicEntry } from './map-topic-entry.helper';

describe('mapTopicEntry', () => {
  it('builds a topic blob from a key/member pair', () => {
    expect(mapTopicEntry(['games', ['n1', 'n2']], 0)).toEqual({
      key: 'games',
      label: 'games',
      color: '#8b5cf6',
      memberIds: ['n1', 'n2'],
    });
  });
});
