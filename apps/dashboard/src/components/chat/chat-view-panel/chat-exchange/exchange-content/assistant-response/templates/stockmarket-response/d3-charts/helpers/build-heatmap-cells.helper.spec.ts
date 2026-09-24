import { describe, expect, it } from 'vitest';

import {
  buildHeatmapCells,
  type HeatmapHistoryPoint,
  type HeatmapProfilePoint,
} from './build-heatmap-cells.helper';

function day(
  time: string,
  low: number,
  high: number,
  volume: number,
): HeatmapHistoryPoint {
  return { time, high, low, volume };
}

describe('buildHeatmapCells', () => {
  it('returns nothing without history', () => {
    expect(buildHeatmapCells([], undefined)).toEqual([]);
    expect(buildHeatmapCells([], undefined, 0)).toEqual([]);
  });

  it('spreads daily volume across the bands the [low, high] range touched', () => {
    // Grid spans 100..200 in 10 bands of 10; the bar touches bands 0..2.
    const data = buildHeatmapCells([day('2026-08-01', 100, 130, 300)]);

    expect(data).toHaveLength(1);
    const cells = data[0].cells;
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.low).toBeLessThan(130);
      expect(cell.high).toBeGreaterThan(100);
      expect(cell.amount).toBe(100); // single day = max volume
    }
  });

  it('rebins intraday profile bands onto the day grid', () => {
    const history = [
      day('2026-08-01', 100, 110, 50),
      day('2026-08-02', 100, 110, 0),
    ];
    const profile: HeatmapProfilePoint[] = [
      {
        time: '2026-08-02',
        bands: [{ low: 105, high: 108, volume: 900 }],
      },
    ];

    const data = buildHeatmapCells(history, profile, 10);

    expect(data).toHaveLength(2);
    const day2 = data[1].cells;
    expect(day2.length).toBeGreaterThan(0);
    for (const cell of day2) {
      expect(cell.low).toBeGreaterThanOrEqual(100);
      expect(cell.high).toBeLessThanOrEqual(115);
    }
    expect(Math.max(...day2.map((c) => c.amount))).toBeGreaterThan(
      Math.max(...data[0].cells.map((c) => c.amount)),
    );
  });

  it('falls back to daily bands for days outside the intraday window', () => {
    const history = [
      day('2026-07-20', 90, 95, 100), // no intraday data
      day('2026-08-02', 100, 110, 0),
    ];
    const profile: HeatmapProfilePoint[] = [
      { time: '2026-08-02', bands: [{ low: 105, high: 108, volume: 900 }] },
    ];

    const data = buildHeatmapCells(history, profile, 10);

    expect(data[0].cells.length).toBeGreaterThan(0);
    expect(data[1].cells.length).toBeGreaterThan(0);
  });

  it('skips zero-volume days entirely', () => {
    const data = buildHeatmapCells([day('2026-08-01', 100, 130, 0)]);
    expect(data[0]?.cells ?? []).toEqual([]);
  });
});
