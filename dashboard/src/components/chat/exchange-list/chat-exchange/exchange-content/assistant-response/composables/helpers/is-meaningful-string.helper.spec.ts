import { describe, expect, it } from 'vitest';

import { isMeaningfulString } from './is-meaningful-string.helper';

describe('isMeaningfulString', () => {
  it('returns false for empty or whitespace strings', () => {
    expect(isMeaningfulString('')).toBe(false);
    expect(isMeaningfulString('   ')).toBe(false);
  });

  it('returns false for placeholder values', () => {
    expect(isMeaningfulString('undefined')).toBe(false);
    expect(isMeaningfulString('null')).toBe(false);
    expect(isMeaningfulString('none')).toBe(false);
    expect(isMeaningfulString('N/A')).toBe(false);
    expect(isMeaningfulString('not applicable')).toBe(false);
  });

  it('returns true for meaningful strings', () => {
    expect(isMeaningfulString('Hello')).toBe(true);
    expect(isMeaningfulString('A finding')).toBe(true);
  });

  it('returns false for non-string values', () => {
    expect(isMeaningfulString(null)).toBe(false);
    expect(isMeaningfulString(42)).toBe(false);
    expect(isMeaningfulString(undefined)).toBe(false);
  });
});
