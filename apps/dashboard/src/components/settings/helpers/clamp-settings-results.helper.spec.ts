import { describe, expect, it } from 'vitest';

import { clampSettingsResults } from './clamp-settings-results.helper';

describe('clampSettingsResults', () => {
  it('returns the value when it is inside the range', () => {
    expect(clampSettingsResults(10)).toBe(10);
    expect(clampSettingsResults(1)).toBe(1);
    expect(clampSettingsResults(200)).toBe(200);
  });

  it('clamps values below 1 to 1', () => {
    expect(clampSettingsResults(0)).toBe(1);
    expect(clampSettingsResults(-5)).toBe(1);
  });

  it('clamps values above the maximum', () => {
    expect(clampSettingsResults(201)).toBe(200);
    expect(clampSettingsResults(1000)).toBe(200);
  });

  it('uses the provided maximum', () => {
    expect(clampSettingsResults(30, 25)).toBe(25);
    expect(clampSettingsResults(10, 25)).toBe(10);
  });

  it('treats non-numeric values as 1', () => {
    expect(clampSettingsResults(Number.NaN)).toBe(1);
    expect(clampSettingsResults(Number.POSITIVE_INFINITY)).toBe(1);
  });
});
