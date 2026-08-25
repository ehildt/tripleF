import { describe, expect, it } from 'vitest';

import { withAlpha } from './with-alpha.helper';

describe('withAlpha', () => {
  it('converts a hex color to rgba with the given alpha', () => {
    expect(withAlpha('#8b5cf6', 0.5)).toBe('rgba(139, 92, 246, 0.5)');
  });

  it('handles a leading-less hex color', () => {
    expect(withAlpha('8b5cf6', 0.25)).toBe('rgba(139, 92, 246, 0.25)');
  });

  it('returns the input unchanged for a non-hex color', () => {
    expect(withAlpha('red', 0.5)).toBe('red');
  });
});
