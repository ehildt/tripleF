import { describe, expect, it } from 'vitest';

import { mapPointToNormalizedValue } from './map-point-to-normalized-value.helper';

describe('mapPointToNormalizedValue', () => {
  it('rebases to 100 at the base', () => {
    expect(mapPointToNormalizedValue({ time: 't', value: 50 }, 100)).toEqual({
      time: 't',
      value: 50,
    });
  });

  it('returns 0 when the base is 0', () => {
    expect(mapPointToNormalizedValue({ time: 't', value: 5 }, 0)).toEqual({
      time: 't',
      value: 0,
    });
  });
});
