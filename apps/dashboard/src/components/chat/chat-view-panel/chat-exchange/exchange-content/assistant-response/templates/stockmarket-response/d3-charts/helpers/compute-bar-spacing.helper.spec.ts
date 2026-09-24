import { describe, expect, it } from 'vitest';

import { computeBarSpacing } from './compute-bar-spacing.helper';

describe('computeBarSpacing', () => {
  it('divides the plot width by the visible bar count', () => {
    expect(computeBarSpacing(400, 100)).toBe(4);
  });

  it('never divides by zero for an empty window', () => {
    expect(computeBarSpacing(400, 0)).toBe(400);
  });
});
