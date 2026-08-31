import { describe, expect, it } from 'vitest';

import { mapInsight } from './map-insight.helper';

describe('mapInsight', () => {
  it('normalizes an insight with an id', () => {
    expect(
      mapInsight({ id: 'i1', text: 'hello', path: 'likes.games' }, 0),
    ).toEqual({
      id: 'i1',
      text: 'hello',
      path: 'likes.games',
    });
  });

  it('falls back to an index-based id', () => {
    expect(mapInsight({ text: 'hello' }, 2).id).toBe('insight-2');
  });
});
