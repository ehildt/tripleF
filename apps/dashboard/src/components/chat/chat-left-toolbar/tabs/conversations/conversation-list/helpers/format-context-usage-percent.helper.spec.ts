import { describe, expect, it } from 'vitest';

import { formatContextUsagePercent } from './format-context-usage-percent.helper';

describe('formatContextUsagePercent', () => {
  it('returns null when no percentage exists (null)', () => {
    expect(formatContextUsagePercent(null)).toBeNull();
  });

  it('returns null when no percentage exists (undefined)', () => {
    expect(formatContextUsagePercent(undefined)).toBeNull();
  });

  it('returns null when the percentage is an empty string', () => {
    expect(formatContextUsagePercent('')).toBeNull();
  });

  it('returns the percentage suffixed with %', () => {
    expect(formatContextUsagePercent('30.00')).toBe('30.00%');
  });

  it('returns a 100% value as-is', () => {
    expect(formatContextUsagePercent('100.00')).toBe('100.00%');
  });
});
