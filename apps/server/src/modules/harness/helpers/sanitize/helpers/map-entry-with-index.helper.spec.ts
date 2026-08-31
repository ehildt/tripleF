import { describe, expect, it } from 'vitest';

import { mapEntryWithIndex } from './map-entry-with-index.helper.js';

describe('mapEntryWithIndex', () => {
  it('pairs an entry with its index', () => {
    expect(mapEntryWithIndex({ a: 1 }, 3)).toEqual({
      entry: { a: 1 },
      index: 3,
    });
  });
});
