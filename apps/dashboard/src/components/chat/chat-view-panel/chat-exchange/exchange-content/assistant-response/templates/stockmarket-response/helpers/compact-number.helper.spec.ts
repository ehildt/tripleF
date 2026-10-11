import { describe, expect, it } from 'vitest';

import { compactNumber } from './compact-number.helper';

describe('compactNumber', () => {
  it('formats billions with two decimals', () => {
    expect(compactNumber(1_240_000_000)).toBe('1.24B');
  });

  it('formats trillions with two decimals', () => {
    expect(compactNumber(2_000_000_000_000)).toBe('2.00T');
  });

  it('formats millions and thousands', () => {
    expect(compactNumber(5_000_000)).toBe('5.00M');
    expect(compactNumber(9_900)).toBe('9.9K');
  });

  it('returns small values unchanged', () => {
    expect(compactNumber(42)).toBe('42');
  });
});
