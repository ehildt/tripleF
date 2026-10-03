import { describe, expect, it } from 'vitest';

import { clampEpisodeScoreThreshold } from './clamp-episode-score-threshold.helper.js';

describe('clampEpisodeScoreThreshold', () => {
  it('returns the default for non-finite input', () => {
    expect(clampEpisodeScoreThreshold(Number.NaN)).toBe(0.1);
    expect(clampEpisodeScoreThreshold(Number.POSITIVE_INFINITY)).toBe(0.1);
  });

  it('clamps into the 0–1 range', () => {
    expect(clampEpisodeScoreThreshold(-1)).toBe(0);
    expect(clampEpisodeScoreThreshold(2)).toBe(1);
    expect(clampEpisodeScoreThreshold(0.55)).toBe(0.55);
  });
});
