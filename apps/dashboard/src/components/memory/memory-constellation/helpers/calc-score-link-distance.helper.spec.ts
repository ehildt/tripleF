import { describe, expect, it } from 'vitest';

import { calcScoreLinkDistance } from './calc-score-link-distance.helper';

describe('calcScoreLinkDistance', () => {
  it('maps the weakest visible and perfect scores to the distance bounds', () => {
    expect(calcScoreLinkDistance(0.7, 0.7)).toBe(280);
    expect(calcScoreLinkDistance(1, 0.7)).toBe(30);
  });

  it('normalizes the score over the configured visible band', () => {
    expect(calcScoreLinkDistance(0.85, 0.7)).toBeCloseTo(92.5);
    expect(calcScoreLinkDistance(0.55, 0.1)).toBeCloseTo(92.5);
  });

  it('applies a non-linear curve to weak links', () => {
    expect(calcScoreLinkDistance(0.8, 0.7)).toBeCloseTo(141.111, 3);
  });

  it('clamps scores outside the visible band', () => {
    expect(calcScoreLinkDistance(0.2, 0.7)).toBe(280);
    expect(calcScoreLinkDistance(1.2, 0.7)).toBe(30);
  });

  it('treats a missing score as the weakest visible link', () => {
    expect(calcScoreLinkDistance(undefined, 0.7)).toBe(280);
  });

  it('keeps a degenerate full-score cutoff finite', () => {
    expect(calcScoreLinkDistance(1, 1)).toBe(30);
  });
});
