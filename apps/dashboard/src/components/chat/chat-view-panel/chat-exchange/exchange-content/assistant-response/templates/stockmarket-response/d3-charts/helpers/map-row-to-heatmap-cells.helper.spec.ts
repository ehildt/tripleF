import { describe, expect, it } from 'vitest';

import { mapRowToHeatmapCells } from './map-row-to-heatmap-cells.helper';

const grid = { minPrice: 0, step: 10, bandCount: 2 };

describe('mapRowToHeatmapCells', () => {
  it('builds non-empty cells with relative amounts', () => {
    const result = mapRowToHeatmapCells(
      { time: 't', volumes: [5, 0] },
      grid,
      10,
    );
    expect(result).toEqual({
      time: 't',
      cells: [{ low: 0, high: 10, amount: 50 }],
    });
  });
});
