import { describe, expect, it } from 'vitest';

import { clampEpisodeProbeLimit } from './clamp-episode-probe-limit.helper.js';

describe('clampEpisodeProbeLimit', () => {
  it('returns the default for non-finite input', () => {
    expect(clampEpisodeProbeLimit(Number.NaN)).toBe(3);
    expect(clampEpisodeProbeLimit(Number.POSITIVE_INFINITY)).toBe(3);
  });

  it('clamps below zero (disables the probe)', () => {
    expect(clampEpisodeProbeLimit(-5)).toBe(0);
  });

  it('leaves larger values unbounded', () => {
    expect(clampEpisodeProbeLimit(100)).toBe(100);
  });

  it('truncates fractional values', () => {
    expect(clampEpisodeProbeLimit(7.9)).toBe(7);
  });
});
