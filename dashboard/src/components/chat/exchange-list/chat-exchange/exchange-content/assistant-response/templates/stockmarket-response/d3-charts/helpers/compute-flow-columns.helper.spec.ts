import { describe, expect, it } from 'vitest';

import type { HeatmapCell } from './build-heatmap-cells.helper';
import { computeFlowColumns } from './compute-flow-columns.helper';

function cells(entries: Array<[number, number, number]>): HeatmapCell[] {
  return entries.map(([low, high, amount]) => ({ low, high, amount }));
}

describe('computeFlowColumns', () => {
  it('centers the ribbon on the volume-weighted price of the day', () => {
    const [column] = computeFlowColumns([
      cells([
        [100, 110, 900], // mid 105, heavy
        [140, 150, 100], // mid 145, light
      ]),
    ]);
    expect(column.centroid).toBeCloseTo(109, 0);
    expect(column.intensity).toBe(1);
  });

  it('normalizes intensity against the busiest day', () => {
    const columns = computeFlowColumns(
      [cells([[100, 110, 100]]), cells([[100, 110, 300]])],
      1, // no smoothing — intensities are per-day
    );
    expect(columns[0].intensity).toBeCloseTo(1 / 3, 3);
    expect(columns[1].intensity).toBe(1);
  });

  it('carries the previous day position through zero-volume days', () => {
    const columns = computeFlowColumns(
      [cells([[100, 110, 100]]), [], cells([[200, 210, 100]])],
      1,
    );
    expect(columns[1].centroid).toBeCloseTo(105, 0);
    expect(columns[1].intensity).toBe(0);
    expect(columns[2].centroid).toBeCloseTo(205, 0);
  });

  it('enforces the minimum half width so the ribbon never collapses', () => {
    const [column] = computeFlowColumns([cells([[100, 100.5, 50]])], 1, 5);
    expect(column.halfWidth).toBe(5);
  });
});
