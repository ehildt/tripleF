import { describe, expect, it } from 'vitest';

import { mapFact } from './map-fact.helper';

describe('mapFact', () => {
  it('normalizes a fact with tags', () => {
    expect(
      mapFact(
        {
          id: 'f1',
          text: 'hello',
          createdAt: '2025-01-01',
          tags: ['a'],
          role: 'user',
          category: 'games',
        },
        0,
      ),
    ).toEqual({
      id: 'f1',
      text: 'hello',
      createdAt: '2025-01-01',
      tags: ['a'],
      role: 'user',
      category: 'games',
    });
  });

  it('falls back to an empty tags array', () => {
    expect(mapFact({ text: 'hello' }, 0).tags).toEqual([]);
  });
});
