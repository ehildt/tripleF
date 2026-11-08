import { describe, expect, it } from 'vitest';

import { isMeaningfulString } from './is-meaningful-string.helper';

describe('isMeaningfulString', () => {
  it('rejects non-strings', () => {
    expect(isMeaningfulString(undefined)).toBe(false);
    expect(isMeaningfulString(null)).toBe(false);
    expect(isMeaningfulString(42)).toBe(false);
  });

  it('rejects empty and whitespace strings', () => {
    expect(isMeaningfulString('')).toBe(false);
    expect(isMeaningfulString('   ')).toBe(false);
  });

  it('rejects placeholder sentinel values', () => {
    for (const value of [
      'undefined',
      'null',
      'none',
      'n/a',
      'na',
      'not applicable',
    ]) {
      expect(isMeaningfulString(value)).toBe(false);
      expect(isMeaningfulString(value.toUpperCase())).toBe(false);
    }
  });

  it('accepts real content', () => {
    expect(isMeaningfulString('a real answer')).toBe(true);
  });
});
