import { describe, expect, it } from 'vitest';

import { clampEpisodeRecencyMidpoint } from './clamp-episode-recency-midpoint.helper.js';

describe('clampEpisodeRecencyMidpoint', () => {
  it('returns the default for non-finite input', () => {
    expect(clampEpisodeRecencyMidpoint(Number.NaN)).toBe(0.5);
    expect(clampEpisodeRecencyMidpoint(Number.POSITIVE_INFINITY)).toBe(0.5);
  });

  it('clamps into the 0.01–0.99 range', () => {
    expect(clampEpisodeRecencyMidpoint(0)).toBe(0.01);
    expect(clampEpisodeRecencyMidpoint(1)).toBe(0.99);
    expect(clampEpisodeRecencyMidpoint(0.4)).toBe(0.4);
  });
});
