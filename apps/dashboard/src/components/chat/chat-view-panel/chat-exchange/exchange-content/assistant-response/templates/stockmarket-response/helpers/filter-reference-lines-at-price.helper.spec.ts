import { describe, expect, it } from 'vitest';

import { filterReferenceLinesAtPrice } from './filter-reference-lines-at-price.helper';

describe('filterReferenceLinesAtPrice', () => {
  it('keeps lines away from the current price', () => {
    const lines = [
      { value: 200, label: 'Support' },
      { value: 230, label: 'Resistance' },
    ];
    expect(filterReferenceLinesAtPrice(lines, 228)).toEqual(lines);
  });

  it('drops a line at the current price', () => {
    const kept = filterReferenceLinesAtPrice(
      [{ value: 228, label: 'Resistance' }],
      228,
    );
    expect(kept).toEqual([]);
  });

  it('drops a line within epsilon of the current price', () => {
    const kept = filterReferenceLinesAtPrice(
      [{ value: 228.1, label: 'Resistance' }],
      228,
    );
    expect(kept).toEqual([]);
  });

  it('keeps a genuine level just beyond epsilon of the current price', () => {
    const kept = filterReferenceLinesAtPrice(
      [{ value: 228.5, label: 'Resistance' }],
      228,
    );
    expect(kept).toHaveLength(1);
  });

  it('returns all lines when the current price is unknown', () => {
    const lines = [{ value: 228, label: 'Resistance' }];
    expect(filterReferenceLinesAtPrice(lines, undefined)).toEqual(lines);
  });
});
