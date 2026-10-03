import { describe, expect, it } from 'vitest';

import { turboColor } from './turbo-color.helper';

describe('turboColor', () => {
  it('keeps turbo within the visible range', () => {
    const c = turboColor(50);
    expect(c.a).toBe(1);
    expect(c.r).toBeGreaterThanOrEqual(0);
    expect(c.b).toBeLessThanOrEqual(255);
  });

  it('clamps turbo amounts outside 0..100', () => {
    expect(turboColor(-5)).toEqual(turboColor(0));
    expect(turboColor(150)).toEqual(turboColor(100));
  });
});
