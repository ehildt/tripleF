import { describe, expect, it } from 'vitest';

import { mapInsightToItem } from './map-insight-to-item.helper.js';

describe('mapInsightToItem', () => {
  it('normalizes an insight into the store-item shape', () => {
    expect(
      mapInsightToItem({ text: '  likes games  ', path: 'Likes.Games' }),
    ).toEqual({ text: 'likes games', path: 'likes.games' });
  });
});
