import { describe, expect, it } from 'vitest';

import { resolveLookbackFrom } from './resolve-lookback-from.helper';

describe('resolveLookbackFrom', () => {
  const today = new Date('2024-01-31T12:00:00Z');

  it('maps a bar count to calendar days plus a holiday buffer', () => {
    // ceil(22 * 1.4) + 10 = 41 days back.
    const expected = new Date(today.getTime() - 41 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(resolveLookbackFrom(22, today)).toBe(expected);
  });

  it('uses the full 10-year retention window for null', () => {
    const expected = new Date(today.getTime() - 3650 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(resolveLookbackFrom(null, today)).toBe(expected);
  });
});
