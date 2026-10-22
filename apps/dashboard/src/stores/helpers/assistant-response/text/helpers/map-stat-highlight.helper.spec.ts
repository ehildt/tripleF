import { describe, expect, it } from 'vitest';

import { mapStatHighlight } from './map-stat-highlight.helper';

describe('mapStatHighlight', () => {
  it('trims label and value', () => {
    expect(mapStatHighlight({ label: '  A ', value: ' 1 ' })).toEqual({
      label: 'A',
      value: '1',
    });
  });
});
