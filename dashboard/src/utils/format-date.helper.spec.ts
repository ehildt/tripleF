import { describe, expect, it } from 'vitest';

import { formatDate } from './format-date.helper';

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns dash for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats a valid ISO date', () => {
    expect(formatDate('2024-01-15T10:30:00.000Z')).toContain('2024');
  });
});
