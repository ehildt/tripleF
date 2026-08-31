import { describe, expect, it } from 'vitest';

import { mapPointToInsight } from './map-point-to-insight.helper.js';

describe('mapPointToInsight', () => {
  it('projects a point into the profile-insight shape', () => {
    expect(mapPointToInsight({ text: 'hello', path: 'likes.games' })).toEqual({
      text: 'hello',
      path: 'likes.games',
    });
  });
});
