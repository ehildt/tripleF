import { describe, expect, it } from 'vitest';

import { findNearestTimeIndex } from './find-nearest-time-index.helper';

const times = [
  '2026-01-01T00:00:00.000Z',
  '2026-01-02T00:00:00.000Z',
  '2026-01-03T00:00:00.000Z',
  '2026-01-04T00:00:00.000Z',
  '2026-01-05T00:00:00.000Z',
];

const timeOfIndex = (i: number) => times[i];

describe('findNearestTimeIndex', () => {
  it('finds an exact match', () => {
    expect(findNearestTimeIndex(timeOfIndex, times.length, times[2])).toBe(2);
  });

  it('finds the nearest index for a time between bars', () => {
    expect(
      findNearestTimeIndex(
        timeOfIndex,
        times.length,
        '2026-01-02T12:00:00.000Z',
      ),
    ).toBe(2);
  });

  it('clamps to the first bar for a time before the range', () => {
    expect(
      findNearestTimeIndex(
        timeOfIndex,
        times.length,
        '2025-12-31T00:00:00.000Z',
      ),
    ).toBe(0);
  });

  it('clamps to the last bar for a time after the range', () => {
    expect(
      findNearestTimeIndex(
        timeOfIndex,
        times.length,
        '2026-02-01T00:00:00.000Z',
      ),
    ).toBe(times.length - 1);
  });

  it('returns undefined for an empty history', () => {
    expect(findNearestTimeIndex(timeOfIndex, 0, times[0])).toBeUndefined();
  });
});
