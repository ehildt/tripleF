import { describe, expect, it } from 'vitest';

import { parseTemporaryRetentionMinutes } from './parse-temporary-retention-minutes.helper';

describe('parseTemporaryRetentionMinutes', () => {
  it('uses the default for a missing value', () => {
    expect(parseTemporaryRetentionMinutes(null)).toBe(10080);
  });

  it('accepts zero and non-negative numeric values', () => {
    expect(parseTemporaryRetentionMinutes('0')).toBe(0);
    expect(parseTemporaryRetentionMinutes('30.5')).toBe(30.5);
  });

  it('uses the default for negative or non-finite values', () => {
    expect(parseTemporaryRetentionMinutes('-1')).toBe(10080);
    expect(parseTemporaryRetentionMinutes('invalid')).toBe(10080);
    expect(parseTemporaryRetentionMinutes('Infinity')).toBe(10080);
  });
});
