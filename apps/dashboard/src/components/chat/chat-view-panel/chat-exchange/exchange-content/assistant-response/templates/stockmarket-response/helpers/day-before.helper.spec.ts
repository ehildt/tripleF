import { describe, expect, it } from 'vitest';

import { dayBefore } from './day-before.helper';

describe('dayBefore', () => {
  it('returns the previous day', () => {
    expect(dayBefore('2026-01-15')).toBe('2026-01-14');
  });

  it('rolls back across month boundaries', () => {
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
  });

  it('rolls back across year boundaries', () => {
    expect(dayBefore('2026-01-01')).toBe('2025-12-31');
  });

  it('handles leap years', () => {
    expect(dayBefore('2024-03-01')).toBe('2024-02-29');
  });
});
