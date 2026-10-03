import { describe, expect, it } from 'vitest';

import { clampEpisodeRecencyWeight } from './clamp-episode-recency-weight.helper.js';

describe('clampEpisodeRecencyWeight', () => {
  it('returns the default for non-finite input', () => {
    expect(clampEpisodeRecencyWeight(Number.NaN)).toBe(0.3);
    expect(clampEpisodeRecencyWeight(Number.POSITIVE_INFINITY)).toBe(0.3);
  });

  it('clamps into the 0–1 range', () => {
    expect(clampEpisodeRecencyWeight(-0.5)).toBe(0);
    expect(clampEpisodeRecencyWeight(1.5)).toBe(1);
    expect(clampEpisodeRecencyWeight(0.25)).toBe(0.25);
  });
});
