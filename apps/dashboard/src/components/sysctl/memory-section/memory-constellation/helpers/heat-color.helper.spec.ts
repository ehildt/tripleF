import { describe, expect, it } from 'vitest';

import { heatColor } from './heat-color.helper';

describe('heatColor', () => {
  it('returns an rgb() string', () => {
    expect(heatColor(0.5)).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('clamps values below 0 and above 1', () => {
    expect(heatColor(-1)).toBe(heatColor(0));
    expect(heatColor(2)).toBe(heatColor(1));
  });

  it('differs between the cold and warm ends', () => {
    expect(heatColor(0)).not.toBe(heatColor(1));
  });
});
