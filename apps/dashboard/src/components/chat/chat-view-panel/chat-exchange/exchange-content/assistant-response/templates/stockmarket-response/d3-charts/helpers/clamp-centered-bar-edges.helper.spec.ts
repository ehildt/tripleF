import { describe, expect, it } from 'vitest';

import { clampCenteredBarEdges } from './clamp-centered-bar-edges.helper';

describe('clampCenteredBarEdges', () => {
  it('keeps a bar fully inside the plot unchanged', () => {
    expect(clampCenteredBarEdges(50, 10, 0, 100)).toEqual({
      left: 40,
      right: 60,
    });
  });

  it('clamps a bar bleeding past the left edge', () => {
    expect(clampCenteredBarEdges(5, 10, 0, 100)).toEqual({
      left: 0,
      right: 15,
    });
  });

  it('clamps a bar bleeding past the right edge', () => {
    expect(clampCenteredBarEdges(95, 10, 0, 100)).toEqual({
      left: 85,
      right: 100,
    });
  });

  it('clamps both edges when wider than the plot', () => {
    expect(clampCenteredBarEdges(50, 200, 0, 100)).toEqual({
      left: 0,
      right: 100,
    });
  });
});
