import { describe, expect, it } from 'vitest';

import { buildLabel } from './build-label.helper';
import { HOUR_MS, MINUTE_MS, MONTH_MS } from './time-units.constant';

describe('buildLabel', () => {
  it('formats month labels as abbreviated month names', () => {
    const fmt = buildLabel({ stepMs: MONTH_MS, align: 'month' });
    expect(fmt(new Date('2024-03-01T00:00:00Z'))).toBe('Mar');
  });

  it('formats hour labels as 12-hour am/pm', () => {
    const fmt = buildLabel({ stepMs: HOUR_MS, align: 'hour' });
    expect(fmt(new Date('2024-01-01T15:00:00Z'))).toBe('3pm');
  });

  it('labels minute ticks with their bucket size', () => {
    const fmt = buildLabel({ stepMs: 15 * MINUTE_MS, align: 'minute' });
    expect(fmt(new Date('2024-01-01T00:00:00Z'))).toBe('15m');
  });
});
