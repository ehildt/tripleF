import { describe, expect, it } from 'vitest';

import { buildIntradayChartPoints } from './build-intraday-chart-points.helper';

describe('buildIntradayChartPoints', () => {
  it('normalizes space-separated UTC datetimes to ISO with a Z suffix', () => {
    const points = buildIntradayChartPoints([
      {
        time: '2023-11-15 14:30:00',
        open: 187.84,
        high: 188.7,
        low: 187.8,
        close: 188.15,
        volume: 11861855,
      },
    ]);

    expect(points).toEqual([
      {
        time: '2023-11-15T14:30:00Z',
        open: 187.84,
        high: 188.7,
        low: 187.8,
        close: 188.15,
        volume: 11861855,
      },
    ]);
  });

  it('defaults a missing volume to zero', () => {
    const points = buildIntradayChartPoints([
      {
        time: '2023-11-15 14:30:00',
        open: 1,
        high: 2,
        low: 1,
        close: 2,
      },
    ]);

    expect(points[0].volume).toBe(0);
  });

  it('leaves already-UTC ISO timestamps untouched', () => {
    const points = buildIntradayChartPoints([
      {
        time: '2023-11-15T14:30:00Z',
        open: 1,
        high: 2,
        low: 1,
        close: 2,
        volume: 3,
      },
    ]);

    expect(points[0].time).toBe('2023-11-15T14:30:00Z');
  });

  it('returns an empty array for no bars', () => {
    expect(buildIntradayChartPoints([])).toEqual([]);
  });
});
