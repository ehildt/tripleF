import { describe, expect, it } from 'vitest';

import { buildTimeTickFormatter } from './build-time-tick-formatter.helper';

describe('buildTimeTickFormatter', () => {
  it('shows the month name once per month and day numbers otherwise', () => {
    const format = buildTimeTickFormatter([
      '2026-05-11',
      '2026-05-26',
      '2026-06-09',
      '2026-06-24',
      '2026-07-09',
    ]);
    expect(format('2026-05-11')).toEqual({ text: 'May', isMajor: true });
    expect(format('2026-05-26')).toEqual({ text: '26', isMajor: false });
    expect(format('2026-06-09')).toEqual({ text: 'Jun', isMajor: true });
    expect(format('2026-06-24')).toEqual({ text: '24', isMajor: false });
    expect(format('2026-07-09')).toEqual({ text: 'Jul', isMajor: true });
  });

  it('formats intraday bars as UTC HH:MM and marks them major', () => {
    const format = buildTimeTickFormatter([
      '2026-01-05T09:30:00Z',
      '2026-01-05T15:00:00Z',
    ]);
    expect(format('2026-01-05T09:30:00Z')).toEqual({
      text: '09:30',
      isMajor: true,
    });
  });

  it('returns empty labels for empty input', () => {
    const format = buildTimeTickFormatter(['2026-01-05']);
    expect(format('')).toEqual({ text: '', isMajor: false });
  });

  it('falls back to the month/day formatter without time-bearing samples', () => {
    const format = buildTimeTickFormatter([]);
    expect(format('2026-02-11')).toEqual({ text: 'Feb', isMajor: true });
  });
});
