import { describe, expect, it } from 'vitest';

import { clampEpisodeRecencyScaleSeconds } from './clamp-episode-recency-scale-seconds.helper.js';

describe('clampEpisodeRecencyScaleSeconds', () => {
  it('returns the default for non-finite input', () => {
    expect(clampEpisodeRecencyScaleSeconds(Number.NaN)).toBe(7 * 24 * 60 * 60);
    expect(clampEpisodeRecencyScaleSeconds(Number.POSITIVE_INFINITY)).toBe(7 * 24 * 60 * 60);
  });

  it('clamps below the minimum', () => {
    expect(clampEpisodeRecencyScaleSeconds(30)).toBe(60);
  });

  it('clamps above the maximum', () => {
    expect(clampEpisodeRecencyScaleSeconds(99_999_999)).toBe(31_536_000);
  });

  it('truncates fractional values within the envelope', () => {
    expect(clampEpisodeRecencyScaleSeconds(1234.9)).toBe(1234);
  });
});
