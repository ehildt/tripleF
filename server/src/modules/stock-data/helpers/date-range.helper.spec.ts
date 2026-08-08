import { describe, expect, it } from 'vitest';

import { addDays, utcToday } from './date-range.helper.js';

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2024-01-01', 1)).toBe('2024-01-02');
  });

  it('rolls over month boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
  });

  it('rolls over year boundaries', () => {
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
  });

  it('handles negative days', () => {
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});

describe('utcToday', () => {
  it('returns today as YYYY-MM-DD', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(utcToday()).toBe(today);
  });
});
