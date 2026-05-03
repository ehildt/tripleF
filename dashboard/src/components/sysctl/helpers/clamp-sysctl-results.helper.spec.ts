import { describe, expect, it } from 'vitest';

import { clampSysctlResults } from './clamp-sysctl-results.helper';

describe('clampSysctlResults', () => {
  it('returns the value when it is inside the range', () => {
    expect(clampSysctlResults(10)).toBe(10);
    expect(clampSysctlResults(1)).toBe(1);
    expect(clampSysctlResults(200)).toBe(200);
  });

  it('clamps values below 1 to 1', () => {
    expect(clampSysctlResults(0)).toBe(1);
    expect(clampSysctlResults(-5)).toBe(1);
  });

  it('clamps values above the maximum', () => {
    expect(clampSysctlResults(201)).toBe(200);
    expect(clampSysctlResults(1000)).toBe(200);
  });

  it('uses the provided maximum', () => {
    expect(clampSysctlResults(30, 25)).toBe(25);
    expect(clampSysctlResults(10, 25)).toBe(10);
  });

  it('treats non-numeric values as 1', () => {
    expect(clampSysctlResults(Number.NaN)).toBe(1);
    expect(clampSysctlResults(Number.POSITIVE_INFINITY)).toBe(1);
  });
});
