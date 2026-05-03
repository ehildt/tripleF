import { describe, expect, it } from 'vitest';

import { calcTabColor } from './calc-tab-color.helper';

describe('calcTabColor', () => {
  it('returns a color-mix string weighted by tint', () => {
    expect(calcTabColor(0)).toBe(
      'color-mix(in srgb, var(--color-tab-rest) 100%, var(--color-tab-accent))',
    );
    expect(calcTabColor(1)).toBe(
      'color-mix(in srgb, var(--color-tab-rest) 0%, var(--color-tab-accent))',
    );
    expect(calcTabColor(0.55)).toBe(
      'color-mix(in srgb, var(--color-tab-rest) 45%, var(--color-tab-accent))',
    );
  });
});
