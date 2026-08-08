import { describe, expect, it } from 'vitest';

import { buildRangeLabel } from './build-range-label.helper';

function points(days: number): Array<{ time: string }> {
  return Array.from({ length: days }, (_, i) => ({
    time: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
  }));
}

describe('buildRangeLabel', () => {
  it('maps the bar count to the smallest covering preset range', () => {
    const long = points(3000);
    expect(buildRangeLabel(long, 0, 5)).toBe('1W');
    expect(buildRangeLabel(long, 0, 22)).toBe('1M');
    expect(buildRangeLabel(long, 0, 66)).toBe('3M');
    expect(buildRangeLabel(long, 0, 132)).toBe('6M');
    expect(buildRangeLabel(long, 0, 252)).toBe('1Y');
    expect(buildRangeLabel(long, 0, 504)).toBe('2Y');
    expect(buildRangeLabel(long, 0, 1260)).toBe('5Y');
  });

  it('reads windows beyond the largest preset as All', () => {
    expect(buildRangeLabel(points(3000), 0, 3000)).toBe('All');
    expect(buildRangeLabel(points(3000), 0, 1800)).toBe('All');
  });

  it('tolerates the zoom transform fractional edges', () => {
    const long = points(3000);
    // A clicked 3M window may land on 66..69 bars.
    expect(buildRangeLabel(long, 0, 67)).toBe('3M');
    expect(buildRangeLabel(long, 0, 69)).toBe('3M');
  });

  it('labels a sub-window of a longer series by its bar count', () => {
    // A 3-month window inside a 10-year series.
    expect(buildRangeLabel(points(3000), 2000, 2066)).toBe('3M');
  });

  it('falls back to All for empty or degenerate windows', () => {
    expect(buildRangeLabel([], 0, 10)).toBe('All');
    expect(buildRangeLabel(points(100), 5, 5)).toBe('All');
  });
});
