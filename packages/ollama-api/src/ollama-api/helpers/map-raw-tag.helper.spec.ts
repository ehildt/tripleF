import { describe, expect, it } from 'vitest';

import { mapRawTag } from './map-raw-tag.helper.ts';

describe('mapRawTag', () => {
  it('normalizes a raw /tags entry', () => {
    expect(mapRawTag({ model: 'llama3', details: { parameter_size: '8B' } })).toEqual({
      name: 'llama3',
      details: { parameter_size: '8B' },
    });
  });

  it('handles a missing details field', () => {
    expect(mapRawTag({ model: 'llama3' })).toEqual({
      name: 'llama3',
      details: undefined,
    });
  });
});
