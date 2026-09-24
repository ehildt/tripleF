import { describe, expect, it } from 'vitest';

import { buildStackedAreaData } from './build-stacked-area-data.helper';

function series(name: string, points: Array<[string, number]>) {
  return {
    name,
    points: points.map(([time, value]) => ({ time, value })),
  };
}

describe('buildStackedAreaData', () => {
  it('unions and sorts all times across series', () => {
    const data = buildStackedAreaData(
      [
        series('A', [
          ['2026-01-02', 1],
          ['2026-01-01', 1],
        ]),
        series('B', [['2026-01-03', 1]]),
      ],
      'raw',
    );
    expect(data.map((d) => d.time)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
  });

  it('normalizes each series to 100 at its first point', () => {
    const data = buildStackedAreaData(
      [
        series('A', [
          ['2026-01-01', 50],
          ['2026-01-02', 100],
        ]),
      ],
      'normalized',
    );
    expect(data[0].values).toEqual([100]);
    expect(data[1].values).toEqual([200]);
  });

  it('keeps raw values in raw mode', () => {
    const data = buildStackedAreaData(
      [
        series('A', [
          ['2026-01-01', 50],
          ['2026-01-02', 100],
        ]),
      ],
      'raw',
    );
    expect(data[1].values).toEqual([100]);
  });

  it('carries the last known value forward across missing dates', () => {
    const data = buildStackedAreaData(
      [
        series('A', [
          ['2026-01-01', 10],
          ['2026-01-03', 30],
        ]),
        series('B', [['2026-01-02', 20]]),
      ],
      'raw',
    );
    expect(data[1].values).toEqual([10, 20]); // A carried from day 1
    expect(data[2].values).toEqual([30, 20]); // B carried from day 2
  });

  it('zeroes series that have not started yet', () => {
    const data = buildStackedAreaData(
      [series('A', [['2026-01-02', 5]]), series('B', [['2026-01-03', 7]])],
      'raw',
    );
    // Day 1 (01-02): A started, B not yet — B carries 0.
    expect(data[0].values).toEqual([5, 0]);
    // Day 2 (01-03): A carried forward, B started.
    expect(data[1].values).toEqual([5, 7]);
  });
});
