import { describe, expect, it } from 'vitest';

import {
  formatRgba,
  greenColor,
  purpleColor,
  turboColor,
} from './heatmap-shaders.helper';

describe('heatmapShaders', () => {
  it('formats rgba components', () => {
    expect(formatRgba({ r: 1, g: 2, b: 3, a: 0.5 })).toBe('rgba(1, 2, 3, 0.5)');
  });

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

  it('ramps green intensity with the amount', () => {
    expect(greenColor(0).a).toBeLessThan(greenColor(100).a);
    expect(greenColor(100).r).toBeGreaterThan(greenColor(0).r);
  });

  it('ramps purple intensity with the amount', () => {
    expect(purpleColor(0).a).toBeLessThan(purpleColor(100).a);
    expect(purpleColor(100).b).toBeGreaterThan(purpleColor(0).b);
  });
});
