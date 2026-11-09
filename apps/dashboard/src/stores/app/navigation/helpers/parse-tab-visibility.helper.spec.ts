import { describe, expect, it } from 'vitest';

import { parseTabVisibility } from './parse-tab-visibility.helper';

describe('parseTabVisibility', () => {
  it('retains boolean values for arbitrary tab keys', () => {
    expect(
      parseTabVisibility('{"chat":false,"custom":true,"debug":"yes"}'),
    ).toEqual({ chat: false, custom: true });
  });

  it('uses no overrides for missing, corrupt, or non-record data', () => {
    expect(parseTabVisibility(null)).toEqual({});
    expect(parseTabVisibility('{')).toEqual({});
    expect(parseTabVisibility('[]')).toEqual({});
    expect(parseTabVisibility('false')).toEqual({});
  });
});
