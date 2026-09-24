import { describe, expect, it } from 'vitest';

import { hasIntradayTimes } from './has-intraday-times.helper';

const daily = [
  '2026-01-01T12:00:00.000Z',
  '2026-01-02T12:00:00.000Z',
  '2026-01-03T12:00:00.000Z',
  '2026-01-04T12:00:00.000Z',
];

const intraday = [
  '2026-01-01T09:30:00.000Z',
  '2026-01-01T09:35:00.000Z',
  '2026-01-01T09:40:00.000Z',
  '2026-01-01T09:45:00.000Z',
];

const timeOf = (times: string[]) => (i: number) => times[i];

describe('hasIntradayTimes', () => {
  it('detects intraday bars even when daily bars carry a time-of-day', () => {
    expect(hasIntradayTimes(timeOf(intraday), 0, intraday.length)).toBe(true);
  });

  it('treats daily bars as non-intraday despite their time component', () => {
    expect(hasIntradayTimes(timeOf(daily), 0, daily.length)).toBe(false);
  });

  it('returns false for a single bar', () => {
    expect(hasIntradayTimes(timeOf(intraday), 0, 1)).toBe(false);
  });

  it('returns false for an empty range', () => {
    expect(hasIntradayTimes(timeOf(intraday), 0, 0)).toBe(false);
  });
});
