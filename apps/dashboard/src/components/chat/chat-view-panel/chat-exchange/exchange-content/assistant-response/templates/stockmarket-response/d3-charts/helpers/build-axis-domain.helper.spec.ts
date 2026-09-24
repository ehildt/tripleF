import { describe, expect, it } from 'vitest';

import { buildAxisDomains } from './build-axis-domain.helper';

function point(low: number, high: number, volume = 100) {
  return { low, high, volume };
}

describe('buildAxisDomains', () => {
  it('spans the visible price range', () => {
    const { price } = buildAxisDomains(
      [point(90, 100), point(95, 120)],
      0,
      false,
    );
    expect(price).toEqual([90, 120]);
  });

  it('adds symmetric headroom to the price domain', () => {
    const { price } = buildAxisDomains([point(90, 100)], 5, false);
    expect(price).toEqual([85, 105]);
  });

  it('provides a volume domain only when the scales are split', () => {
    const single = buildAxisDomains([point(90, 100, 500)], 0, false);
    expect(single.volume).toBeNull();

    const split = buildAxisDomains([point(90, 100, 500)], 0, true);
    expect(split.volume).toEqual([0, 500]);
  });

  it('never collapses a flat price series', () => {
    const { price } = buildAxisDomains([point(100, 100)], 0, false);
    expect(price[1] - price[0]).toBe(1);
  });

  it('handles an empty series', () => {
    const { price, volume } = buildAxisDomains([], 0, true);
    expect(price).toEqual([0, 1]);
    expect(volume).toEqual([0, 1]);
  });
});
