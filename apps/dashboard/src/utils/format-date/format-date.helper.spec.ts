import { describe, expect, it } from 'vitest';

import { formatDate } from './format-date.helper';

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null, 'en')).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('', 'en')).toBe('—');
  });

  it('returns dash for invalid date', () => {
    expect(formatDate('not-a-date', 'en')).toBe('—');
  });

  it('formats a valid ISO date with the given locale', () => {
    expect(formatDate('2024-01-15T10:30:00.000Z', 'en')).toContain('2024');
  });

  it('applies locale-specific formatting', () => {
    const en = formatDate('2024-01-15T10:30:00.000Z', 'en');
    const de = formatDate('2024-01-15T10:30:00.000Z', 'de');
    expect(en).not.toBe(de);
  });
});
