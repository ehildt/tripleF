import { describe, expect, it } from 'vitest';

import { mapColumnToCell } from './map-column-to-cell.helper';

describe('mapColumnToCell', () => {
  it('formats a scored cell', () => {
    expect(mapColumnToCell('A', new Map([['A', 5]]), 'A')).toEqual({
      column: 'A',
      text: '5',
      winner: true,
    });
  });

  it('uses an em dash for an unscored cell', () => {
    expect(mapColumnToCell('B', new Map(), undefined)).toEqual({
      column: 'B',
      text: '—',
      winner: false,
    });
  });
});
