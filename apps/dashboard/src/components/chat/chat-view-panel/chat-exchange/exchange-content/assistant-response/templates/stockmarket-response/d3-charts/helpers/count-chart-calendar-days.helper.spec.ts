import { describe, expect, it } from 'vitest';

import { countChartCalendarDays } from './count-chart-calendar-days.helper';

describe('countChartCalendarDays', () => {
  it('prefers the server-reported range', () => {
    expect(
      countChartCalendarDays({ from: '2026-01-01', to: '2026-01-11' }, []),
    ).toBe(10);
  });

  it('falls back to the history first/last times when the range is absent', () => {
    expect(
      countChartCalendarDays(undefined, [
        { time: '2026-01-01' },
        { time: '2026-01-06' },
      ]),
    ).toBe(5);
  });

  it('falls back when the range is unparsable', () => {
    expect(
      countChartCalendarDays({ from: 'x', to: 'y' }, [
        { time: '2026-01-01' },
        { time: '2026-01-04' },
      ]),
    ).toBe(3);
  });

  it('returns zero for a single history point', () => {
    expect(countChartCalendarDays(undefined, [{ time: '2026-01-01' }])).toBe(0);
  });
});
