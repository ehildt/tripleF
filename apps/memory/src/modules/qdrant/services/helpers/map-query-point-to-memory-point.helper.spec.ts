import { describe, expect, it } from 'vitest';

import { mapQueryPointToMemoryPoint } from './map-query-point-to-memory-point.helper.js';

describe('mapQueryPointToMemoryPoint', () => {
  it('projects a query point into the memory-point shape', () => {
    expect(
      mapQueryPointToMemoryPoint({
        id: 'id1',
        score: 0.8,
        payload: { category: 'games', tags: ['a'] },
      }),
    ).toEqual({
      id: 'id1',
      score: 0.8,
      category: 'games',
      tags: ['a'],
    });
  });

  it('falls back to defaults for missing fields', () => {
    expect(mapQueryPointToMemoryPoint({ id: 1 })).toEqual({
      id: '1',
      score: 0,
      category: undefined,
      tags: [],
    });
  });
});
