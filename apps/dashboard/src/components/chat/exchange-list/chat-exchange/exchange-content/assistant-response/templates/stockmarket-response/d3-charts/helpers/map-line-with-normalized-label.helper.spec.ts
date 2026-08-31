import { describe, expect, it } from 'vitest';

import { mapLineWithNormalizedLabel } from './map-line-with-normalized-label.helper';

describe('mapLineWithNormalizedLabel', () => {
  it('normalizes a reference line label', () => {
    expect(
      mapLineWithNormalizedLabel({ value: 100, label: '52w high' }),
    ).toEqual({ value: 100, label: '52W HIGH' });
  });
});
