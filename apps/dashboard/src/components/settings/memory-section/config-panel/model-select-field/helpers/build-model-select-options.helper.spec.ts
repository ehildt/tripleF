import { describe, expect, it } from 'vitest';

import { buildModelSelectOptions } from './build-model-select-options.helper';

describe('buildModelSelectOptions', () => {
  it('puts the default label first, then the catalog', () => {
    expect(buildModelSelectOptions(['a:1b', 'b:2b'], '', 'Default')).toEqual([
      'Default',
      'a:1b',
      'b:2b',
    ]);
  });

  it('appends a current override that is missing from the catalog', () => {
    expect(buildModelSelectOptions(['a:1b'], 'gone:3b', 'Default')).toEqual([
      'Default',
      'a:1b',
      'gone:3b',
    ]);
  });

  it('does not duplicate a current override already in the catalog', () => {
    expect(buildModelSelectOptions(['a:1b'], 'a:1b', 'Default')).toEqual([
      'Default',
      'a:1b',
    ]);
  });

  it('lists only the default label when the catalog is empty', () => {
    expect(buildModelSelectOptions([], '', 'Default')).toEqual(['Default']);
  });
});
