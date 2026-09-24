import { describe, expect, it } from 'vitest';

import { mapPointToRawValue } from './map-point-to-raw-value.helper';

describe('mapPointToRawValue', () => {
  it('copies time and value', () => {
    expect(mapPointToRawValue({ time: 't', value: 5 })).toEqual({
      time: 't',
      value: 5,
    });
  });
});
