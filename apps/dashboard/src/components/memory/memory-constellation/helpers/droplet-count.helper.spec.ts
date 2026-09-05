import { describe, expect, it } from 'vitest';

import { dropletCount } from './droplet-count.helper';

describe('dropletCount', () => {
  it('returns the minimum for unscored or zero-score edges', () => {
    expect(dropletCount(undefined)).toBe(3);
    expect(dropletCount(0)).toBe(3);
  });

  it('returns the maximum for a perfect score', () => {
    expect(dropletCount(1)).toBe(10);
  });

  it('scales monotonically with the score', () => {
    expect(dropletCount(0.5)).toBe(7); // 3 + round(7 × 0.5)
    expect(dropletCount(0.8)).toBe(9); // 3 + round(7 × 0.8)
  });

  it('clamps out-of-range scores', () => {
    expect(dropletCount(1.5)).toBe(10);
    expect(dropletCount(-1)).toBe(3);
  });
});
