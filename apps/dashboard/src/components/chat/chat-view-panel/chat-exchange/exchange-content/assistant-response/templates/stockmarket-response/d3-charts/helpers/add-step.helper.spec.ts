import { describe, expect, it } from 'vitest';

import { addStep } from './add-step.helper';
import { DAY_MS, MONTH_MS } from './time-units.constant';

describe('addStep', () => {
  it('advances a month-aligned interval by whole months', () => {
    const d = new Date('2024-01-15T00:00:00Z');
    expect(
      addStep(d, { stepMs: 2 * MONTH_MS, align: 'month' }).toISOString(),
    ).toBe('2024-03-15T00:00:00.000Z');
  });

  it('advances a fixed-step interval by its milliseconds', () => {
    const d = new Date('2024-01-15T00:00:00Z');
    expect(addStep(d, { stepMs: DAY_MS, align: 'day' }).toISOString()).toBe(
      '2024-01-16T00:00:00.000Z',
    );
  });
});
