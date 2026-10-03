import { describe, expect, it } from 'vitest';

import { formatRgba } from './format-rgba.helper';

describe('formatRgba', () => {
  it('formats rgba components', () => {
    expect(formatRgba({ r: 1, g: 2, b: 3, a: 0.5 })).toBe('rgba(1, 2, 3, 0.5)');
  });
});
