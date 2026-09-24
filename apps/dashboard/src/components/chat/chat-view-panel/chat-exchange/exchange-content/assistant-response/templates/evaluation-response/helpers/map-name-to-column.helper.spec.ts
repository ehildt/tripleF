import { describe, expect, it } from 'vitest';

import { mapNameToColumn } from './map-name-to-column.helper';

describe('mapNameToColumn', () => {
  it('marks the winner column', () => {
    expect(mapNameToColumn('A', 'A')).toEqual({ name: 'A', winner: true });
    expect(mapNameToColumn('B', 'A')).toEqual({ name: 'B', winner: false });
  });
});
