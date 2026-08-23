import { describe, expect, it } from 'vitest';

import { formatTotalDuration } from './format-total-duration.helper';

describe('formatTotalDuration', () => {
  it('formats milliseconds for sub-second durations', () => {
    expect(formatTotalDuration(42_000_000)).toBe('42ms');
    expect(formatTotalDuration(0)).toBe('0ms');
  });

  it('formats seconds for >= 1s durations', () => {
    expect(formatTotalDuration(1_000_000_000)).toBe('1.0s');
    expect(formatTotalDuration(2_500_000_000)).toBe('2.5s');
  });
});
