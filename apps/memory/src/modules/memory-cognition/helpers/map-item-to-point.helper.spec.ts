import { describe, expect, it } from 'vitest';

import { mapItemToPoint } from './map-item-to-point.helper.js';

describe('mapItemToPoint', () => {
  it('assembles a cognition insight point', () => {
    const point = mapItemToPoint(
      { text: 'likes games', path: 'likes.games' },
      0,
      [[1, 2]],
      'cog1',
    );
    expect(point.text).toBe('likes games');
    expect(point.vector).toEqual([1, 2]);
    expect(point.path).toBe('likes.games');
    expect(point.tags.length).toBeGreaterThan(0);
    expect(point.id).toBeTruthy();
  });
});
