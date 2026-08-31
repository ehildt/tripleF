import { describe, expect, it } from 'vitest';

import { computeNodeRadius } from './compute-node-radius.helper';

describe('computeNodeRadius', () => {
  it('grows a leaf dot with its link count (capped)', () => {
    expect(computeNodeRadius(0, false, false, false, 1, 1)).toBe(4);
    expect(computeNodeRadius(10, false, false, false, 1, 1)).toBe(7);
    expect(computeNodeRadius(100, false, false, false, 1, 1)).toBe(8);
  });

  it('boosts main dots (hubs, category dots, root) by 50%', () => {
    const leaf = computeNodeRadius(2, false, false, false, 1, 1);
    const hub = computeNodeRadius(2, true, false, false, 1, 1);
    expect(hub).toBeCloseTo(leaf * 1.5);
  });

  it('gives the root a fixed larger base', () => {
    expect(computeNodeRadius(0, true, false, true, 1, 1)).toBe(13.5);
  });

  it('scales by projection depth and clamps zoom', () => {
    const base = computeNodeRadius(0, false, false, false, 1, 1);
    expect(computeNodeRadius(0, false, false, false, 0.5, 1)).toBeCloseTo(
      base * 0.5,
    );
    expect(computeNodeRadius(0, false, false, false, 1, 8)).toBeCloseTo(
      base * 4,
    );
  });
});
