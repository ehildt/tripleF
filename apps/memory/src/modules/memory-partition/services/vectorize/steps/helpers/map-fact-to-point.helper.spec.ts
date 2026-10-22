import { describe, expect, it } from 'vitest';

import { mapFactToPoint } from './map-fact-to-point.helper.js';

describe('mapFactToPoint', () => {
  it('assembles a memory point from an extracted fact', () => {
    const fact = {
      text: 'likes games',
      subject: 'user',
      node: 'general',
      category: 'games',
      community: 'video games',
      kind: 'preference' as const,
      stability: 'durable' as const,
    };
    const point = mapFactToPoint(
      fact,
      0,
      [[1, 2, 3]],
      { facts: [fact], tags: ['games'], category: 'hobbies' },
      'p1',
      'user',
    );
    expect(point.text).toBe('likes games');
    expect(point.vector).toEqual([1, 2, 3]);
    expect(point.tags).toEqual(['games']);
    expect(point.category).toBe('games');
    expect(point.subject).toBe('user');
    expect(point.kind).toBe('preference');
    expect(point.stability).toBe('durable');
    expect(point.id).toBeTruthy();
  });
});
