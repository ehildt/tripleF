import { describe, expect, it } from 'vitest';

import { alignToBucket } from './align-to-bucket.helper';
import { DAY_MS, MINUTE_MS, MONTH_MS, WEEK_MS } from './time-units.constant';

describe('alignToBucket', () => {
  it('aligns to the start of the month', () => {
    const d = new Date('2024-01-15T12:30:00Z');
    expect(
      alignToBucket(d, { stepMs: MONTH_MS, align: 'month' }).toISOString(),
    ).toBe('2024-01-01T00:00:00.000Z');
  });

  it('aligns to the start of the week (Monday)', () => {
    const d = new Date('2024-01-17T12:00:00Z');
    expect(
      alignToBucket(d, { stepMs: WEEK_MS, align: 'week' }).toISOString(),
    ).toBe('2024-01-15T00:00:00.000Z');
  });

  it('aligns to the start of the day', () => {
    const d = new Date('2024-01-15T12:30:00Z');
    expect(
      alignToBucket(d, { stepMs: DAY_MS, align: 'day' }).toISOString(),
    ).toBe('2024-01-15T00:00:00.000Z');
  });

  it('aligns minutes to the nearest step bucket', () => {
    const d = new Date('2024-01-15T12:37:00Z');
    expect(
      alignToBucket(d, {
        stepMs: 15 * MINUTE_MS,
        align: 'minute',
      }).toISOString(),
    ).toBe('2024-01-15T12:30:00.000Z');
  });
});
