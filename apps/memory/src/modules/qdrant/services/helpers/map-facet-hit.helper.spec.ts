import { describe, expect, it } from 'vitest';

import { mapFacetHit } from './map-facet-hit.helper.js';

describe('mapFacetHit', () => {
  it('projects a facet hit into the value/count shape', () => {
    expect(mapFacetHit({ value: 'games', count: 3 })).toEqual({
      value: 'games',
      count: 3,
    });
  });

  it('stringifies non-string values', () => {
    expect(mapFacetHit({ value: 42, count: 1 })).toEqual({
      value: '42',
      count: 1,
    });
  });
});
