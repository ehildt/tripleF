import { describe, expect, it } from 'vitest';

import { clampCognitionLimit } from './clamp-cognition-limit.helper.js';

describe('clampCognitionLimit', () => {
  it('returns the default for non-finite input', () => {
    expect(clampCognitionLimit(Number.NaN)).toBe(5000);
    expect(clampCognitionLimit(Number.POSITIVE_INFINITY)).toBe(5000);
  });

  it('clamps below the minimum', () => {
    expect(clampCognitionLimit(100)).toBe(500);
  });

  it('clamps above the maximum', () => {
    expect(clampCognitionLimit(100_000)).toBe(32_000);
  });

  it('truncates fractional values within the envelope', () => {
    expect(clampCognitionLimit(1234.9)).toBe(1234);
  });
});
