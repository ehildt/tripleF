import { describe, expect, it } from 'vitest';

import { computePlotBands } from './compute-plot-bands.helper';

describe('computePlotBands', () => {
  it('lets the price fill the plot when the scales are not split', () => {
    const bands = computePlotBands(10, 290, false);
    expect(bands.volume).toBeNull();
    expect(bands.price.top).toBeCloseTo(10 + 280 * 0.06, 5);
    expect(bands.price.bottom).toBeCloseTo(290 - 280 * 0.03, 5);
  });

  it('reserves the bottom third for the volume scale when split', () => {
    const bands = computePlotBands(10, 290, true);
    expect(bands.price.top).toBeCloseTo(10 + 280 * 0.1, 5);
    expect(bands.price.bottom).toBeCloseTo(10 + 280 * 0.6, 5);
    expect(bands.volume?.top).toBeCloseTo(10 + 280 * 0.7, 5);
    expect(bands.volume?.bottom).toBeCloseTo(290, 5);
  });
});
