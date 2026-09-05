import { describe, expect, it } from 'vitest';

import { mapFacetToCategory } from './map-facet-to-category.helper.js';

describe('mapFacetToCategory', () => {
  it('normalizes a category facet', () => {
    expect(mapFacetToCategory({ value: 'Games', count: 3 })).toEqual({
      value: 'games',
      count: 3,
    });
  });
});
