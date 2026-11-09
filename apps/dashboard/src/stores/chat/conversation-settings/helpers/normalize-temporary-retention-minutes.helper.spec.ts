import { describe, expect, it } from 'vitest';

import { normalizeTemporaryRetentionMinutes } from './normalize-temporary-retention-minutes.helper';

describe('normalizeTemporaryRetentionMinutes', () => {
  it('floors positive values to whole minutes', () => {
    expect(normalizeTemporaryRetentionMinutes(30.9)).toBe(30);
    expect(normalizeTemporaryRetentionMinutes(30)).toBe(30);
  });

  it('clamps negative values to zero', () => {
    expect(normalizeTemporaryRetentionMinutes(-1)).toBe(0);
  });

  it('accepts zero', () => {
    expect(normalizeTemporaryRetentionMinutes(0)).toBe(0);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'normalizes non-finite value %s to zero',
    (value) => {
      expect(normalizeTemporaryRetentionMinutes(value)).toBe(0);
    },
  );
});
