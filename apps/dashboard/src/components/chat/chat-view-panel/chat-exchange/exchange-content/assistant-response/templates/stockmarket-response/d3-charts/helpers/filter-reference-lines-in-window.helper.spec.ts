import { describe, expect, it } from 'vitest';

import { filterReferenceLinesInWindow } from './filter-reference-lines-in-window.helper';

// 10 ascending bars; the high/low/close all rise with the index.
const points = Array.from({ length: 10 }, (_, i) => ({
  high: 100 + i * 10,
  low: 95 + i * 10,
  close: 98 + i * 10,
}));

describe('filterReferenceLinesInWindow', () => {
  it('keeps a level whose value occurs inside the window', () => {
    // The 52W-high-style level at bar 8's high sits inside [4, 10).
    const result = filterReferenceLinesInWindow(
      [{ value: 180, label: '52W HIGH' }],
      points,
      4,
      10,
    );
    expect(result).toEqual([{ value: 180, label: '52W HIGH' }]);
  });

  it('drops a level whose value only occurs outside the window', () => {
    // Bar 8's high (180) is outside [0, 4): the 52W high is not in a 3M view.
    const result = filterReferenceLinesInWindow(
      [{ value: 180, label: '52W HIGH' }],
      points,
      0,
      4,
    );
    expect(result).toEqual([]);
  });

  it('keeps a level that matches an in-window bar on a tie', () => {
    // The same price occurs at bar 2 (outside) and bar 6 (inside).
    const flat = points.map((p, i) => ({
      ...p,
      high: i === 2 || i === 6 ? 150 : p.high,
    }));
    const result = filterReferenceLinesInWindow(
      [{ value: 150, label: 'Support' }],
      flat,
      4,
      10,
    );
    expect(result).toHaveLength(1);
  });

  it('returns the lines untouched without data', () => {
    const lines = [{ value: 100, label: 'Support' }];
    expect(filterReferenceLinesInWindow(lines, [], 0, 10)).toBe(lines);
  });
});
