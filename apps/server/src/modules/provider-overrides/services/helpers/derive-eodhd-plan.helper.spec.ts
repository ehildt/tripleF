import { describe, expect, it } from 'vitest';

import { deriveEodhdPlan } from './derive-eodhd-plan.helper.js';

describe('deriveEodhdPlan', () => {
  it('returns undefined when the quota is unknown', () => {
    expect(deriveEodhdPlan(undefined)).toBeUndefined();
    expect(deriveEodhdPlan(0)).toBeUndefined();
  });

  it('labels the free plan at or under the free-plan limit', () => {
    expect(deriveEodhdPlan(20)).toBe('Free');
    expect(deriveEodhdPlan(19)).toBe('Free');
  });

  it('labels paid plans with their localized daily quota', () => {
    expect(deriveEodhdPlan(21)).toBe(`${(21).toLocaleString()} calls / day`);
    expect(deriveEodhdPlan(1000)).toBe(
      `${(1000).toLocaleString()} calls / day`,
    );
  });
});
