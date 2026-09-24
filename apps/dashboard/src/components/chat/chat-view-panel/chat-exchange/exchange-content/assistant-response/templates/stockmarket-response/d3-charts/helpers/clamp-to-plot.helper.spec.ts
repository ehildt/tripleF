import { describe, expect, it } from 'vitest';

import { clampToPlot } from './clamp-to-plot.helper';

const plot = { left: 0, top: 10, right: 100, bottom: 90 };

describe('clampToPlot', () => {
  it('passes coordinates inside the plot through', () => {
    expect(clampToPlot(50, plot)).toBe(50);
  });

  it('clamps coordinates above the plot to its top', () => {
    expect(clampToPlot(5, plot)).toBe(10);
  });

  it('clamps coordinates below the plot to its bottom', () => {
    expect(clampToPlot(120, plot)).toBe(90);
  });
});
