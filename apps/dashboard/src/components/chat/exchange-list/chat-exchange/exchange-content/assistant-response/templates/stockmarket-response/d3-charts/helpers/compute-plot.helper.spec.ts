import { describe, expect, it } from 'vitest';

import { computePlot } from './compute-plot.helper';

describe('computePlot', () => {
  it('reserves the default gutters', () => {
    expect(computePlot(400, 300)).toEqual({
      left: 6,
      top: 6,
      right: 344,
      bottom: 276,
    });
  });

  it('grows the right gutter to fit a wider badge', () => {
    const plot = computePlot(400, 300, 120);
    expect(plot.right).toBe(280);
  });

  it('never lets the plot collapse below the padding', () => {
    const plot = computePlot(20, 20);
    expect(plot.right).toBeGreaterThanOrEqual(plot.left);
    expect(plot.bottom).toBeGreaterThanOrEqual(plot.top);
  });
});
