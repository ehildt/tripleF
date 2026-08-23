import { describe, expect, it } from 'vitest';

import { filterReferenceLinesInRange } from './filter-reference-lines-in-range.helper';

function makePoints(count: number) {
  // Rising series from ~95 to an all-time high of 236.54 at the last bar.
  return Array.from({ length: count }, (_, i) => {
    const close = 95 + i * 0.9;
    return { high: close + 1, low: close - 1 };
  });
}

describe('filterReferenceLinesInRange', () => {
  const points = makePoints(160); // max high ≈ 236.54, min low = 94

  it('keeps levels that exist inside the data range', () => {
    const lines = [
      { value: 94, label: 'Low' },
      { value: 236.54, label: 'All-Time High' },
      { value: 150 },
    ];

    expect(filterReferenceLinesInRange(lines, points)).toHaveLength(3);
  });

  it('drops a web-searched level that never occurs in the data', () => {
    const lines = [
      { value: 265, label: 'All-Time High' },
      { value: 200, label: 'Support' },
    ];

    const result = filterReferenceLinesInRange(lines, points);
    expect(result).toEqual([{ value: 200, label: 'Support' }]);
  });

  it('forgives rounding noise right at the extremes', () => {
    const maxHigh = Math.max(...points.map((p) => p.high));
    const minLow = Math.min(...points.map((p) => p.low));
    const justOutside = (maxHigh - minLow) * 0.02;

    const lines = [
      { value: maxHigh + justOutside, label: 'ATH (rounded)' },
      { value: minLow - justOutside, label: 'ATL (rounded)' },
    ];

    expect(filterReferenceLinesInRange(lines, points)).toHaveLength(2);
  });

  it('keeps everything when there is no data', () => {
    const lines = [{ value: 999 }];
    expect(filterReferenceLinesInRange(lines, [])).toEqual(lines);
  });
});
