import { describe, expect, it } from 'vitest';

import { buildTimeTickPlan } from './build-time-tick-plan.helper';

describe('buildTimeTickPlan', () => {
  it('uses month ticks for a multi-month range', () => {
    const ticks = buildTimeTickPlan(
      '2026-01-15T00:00:00.000Z',
      '2026-06-20T00:00:00.000Z',
      300,
      false,
    );
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].text).toBe('Feb');
    expect(ticks[0].isMajor).toBe(true);
    expect(ticks.every((t) => t.isMajor)).toBe(true);
  });

  it('uses week ticks for a several-week range', () => {
    const ticks = buildTimeTickPlan(
      '2026-01-05T00:00:00.000Z',
      '2026-02-05T00:00:00.000Z',
      300,
      false,
    );
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].isMajor).toBe(true);
    // Week ticks align to Mondays.
    expect(new Date(ticks[0].time).getUTCDay()).toBe(1);
  });

  it('uses day ticks for a two-week range', () => {
    const ticks = buildTimeTickPlan(
      '2026-01-05T00:00:00.000Z',
      '2026-01-19T00:00:00.000Z',
      300,
      false,
    );
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].isMajor).toBe(false);
    expect(ticks[0].text).toMatch(/^\d+$/);
    // Day labels appear on every other line so the axis stays clean.
    const labeled = ticks.filter((t) => t.text !== '');
    expect(labeled.length).toBeGreaterThan(0);
    expect(labeled.length).toBeLessThan(ticks.length);
  });

  it('uses hour ticks for a one-day intraday range', () => {
    const ticks = buildTimeTickPlan(
      '2026-08-01T09:30:00.000Z',
      '2026-08-01T16:00:00.000Z',
      300,
      true,
    );
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].text).toMatch(/^\d{1,2}(am|pm)$/);
    expect(ticks[0].isMajor).toBe(true);
  });

  it('uses 30-minute ticks for a short intraday range', () => {
    const ticks = buildTimeTickPlan(
      '2026-08-01T09:30:00.000Z',
      '2026-08-01T14:00:00.000Z',
      300,
      true,
    );
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].text).toBe('30m');
    expect(ticks[0].isMajor).toBe(false);
    // 30-minute buckets land on :00 or :30.
    expect(
      ticks.every((t) => new Date(t.time).getUTCMinutes() % 30 === 0),
    ).toBe(true);
  });

  it('uses 5-minute ticks for a short intraday range', () => {
    const ticks = buildTimeTickPlan(
      '2026-08-01T09:30:00.000Z',
      '2026-08-01T10:30:00.000Z',
      300,
      true,
    );
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].text).toBe('5m');
    expect(ticks.every((t) => new Date(t.time).getUTCMinutes() % 5 === 0)).toBe(
      true,
    );
  });

  it('returns no ticks for an empty range', () => {
    expect(buildTimeTickPlan('', '', 300, false)).toEqual([]);
  });
});
