import { describe, expect, it } from 'vitest';

import { easeInCubic } from './ease-in-cubic.helper';

describe('easeInCubic', () => {
  it('starts slow and accelerates to 1', () => {
    expect(easeInCubic(0)).toBe(0);
    expect(easeInCubic(0.5)).toBeLessThan(0.5);
    expect(easeInCubic(1)).toBe(1);
  });
});
