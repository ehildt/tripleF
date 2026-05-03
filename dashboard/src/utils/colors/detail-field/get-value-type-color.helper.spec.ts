import { describe, expect, it } from 'vitest';

import { getValueTypeColor } from './get-value-type-color.helper';

describe('getValueTypeColor', () => {
  it('colors booleans', () => {
    expect(getValueTypeColor(true)).toBe('text-harmony-1');
    expect(getValueTypeColor('true')).toBe('text-harmony-1');
  });

  it('colors numbers', () => {
    expect(getValueTypeColor(42)).toBe('text-harmony-2');
    expect(getValueTypeColor('3.14')).toBe('text-harmony-2');
  });

  it('returns null for strings', () => {
    expect(getValueTypeColor('hello')).toBeNull();
  });
});
