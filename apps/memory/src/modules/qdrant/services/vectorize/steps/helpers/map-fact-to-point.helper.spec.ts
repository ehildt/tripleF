import { describe, expect, it } from 'vitest';

import { mapFactToPoint } from './map-fact-to-point.helper.js';

describe('mapFactToPoint', () => {
  it('assembles a memory point from an extracted fact', () => {
    const point = mapFactToPoint(
      'likes games',
      0,
      [[1, 2, 3]],
      { facts: ['likes games'], tags: ['games'], category: 'Games' },
      'p1',
      'user',
    );
    expect(point.text).toBe('likes games');
    expect(point.vector).toEqual([1, 2, 3]);
    expect(point.tags).toEqual(['games']);
    expect(point.category).toBe('Games');
    expect(point.id).toBeTruthy();
  });
});
