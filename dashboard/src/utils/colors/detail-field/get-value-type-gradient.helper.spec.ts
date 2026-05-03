import { describe, expect, it } from 'vitest';

import { getValueTypeGradient } from './get-value-type-gradient.helper';

describe('getValueTypeGradient', () => {
  it('returns gradient for numbers', () => {
    expect(getValueTypeGradient(42)).toContain('from-harmony-2');
  });

  it('returns null for strings', () => {
    expect(getValueTypeGradient('hello')).toBeNull();
  });
});
