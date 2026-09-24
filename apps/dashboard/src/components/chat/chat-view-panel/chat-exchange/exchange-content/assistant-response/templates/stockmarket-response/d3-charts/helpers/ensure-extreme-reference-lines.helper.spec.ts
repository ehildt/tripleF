import { describe, expect, it } from 'vitest';

import { ensureExtremeReferenceLines } from './ensure-extreme-reference-lines.helper';

/** 100 daily bars rising; the range high is the last bar, the low the first. */
const points = Array.from({ length: 100 }, (_, i) => {
  const close = 100 + i;
  return {
    time: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    high: close + 2,
    low: close - 3,
  };
});
const maxHigh = Math.max(...points.map((p) => p.high));
const minLow = Math.min(...points.map((p) => p.low));

describe('ensureExtremeReferenceLines', () => {
  it('adds exactly one range ATH and one range ATL level line', () => {
    const result = ensureExtremeReferenceLines(
      [],
      points,
      { from: 0, to: 100 },
      '1Y',
    );

    expect(result).toEqual([
      { value: maxHigh, label: '1Y HIGH', color: 'harmony-2' },
      { value: minLow, label: '1Y LOW', color: 'harmony-4' },
    ]);
  });

  it('replaces a model line at the high with the canonical label', () => {
    const result = ensureExtremeReferenceLines(
      [
        { value: maxHigh, label: 'All Time High', color: 'status-error' },
        { value: minLow, label: '52w Low', color: 'status-info' },
      ],
      points,
      { from: 0, to: 100 },
      'All',
    );

    // Both of the model's extreme lines are replaced by the canonical ones.
    expect(result).toEqual([
      { value: maxHigh, label: 'All HIGH', color: 'harmony-2' },
      { value: minLow, label: 'All LOW', color: 'harmony-4' },
    ]);
  });

  it('computes the extremes over the given range slice', () => {
    // A window over bars 40..59: high at index 59, low at index 40.
    const result = ensureExtremeReferenceLines(
      [],
      points,
      { from: 40, to: 60 },
      '3M',
    );
    expect(result).toEqual([
      { value: points[59].high, label: '3M HIGH', color: 'harmony-2' },
      { value: points[40].low, label: '3M LOW', color: 'harmony-4' },
    ]);
  });

  it('normalizes kept model extreme labels to the canonical format', () => {
    // A "52w high" line at a level that is NOT the range extreme survives
    // and is rewritten to the canonical "52W HIGH" spelling.
    const midLevel = points[50].high;
    const result = ensureExtremeReferenceLines(
      [{ value: midLevel, label: '52w high', color: 'status-info' }],
      points,
      { from: 0, to: 100 },
      'All',
    );
    expect(result).toContainEqual({
      value: midLevel,
      label: '52W HIGH',
      color: 'status-info',
    });
  });

  it('stays out of intraday series and empty inputs', () => {
    expect(
      ensureExtremeReferenceLines(
        [],
        points,
        { from: 0, to: 100 },
        '1Y',
        false,
      ),
    ).toEqual([]);
    expect(
      ensureExtremeReferenceLines([], [], { from: 0, to: 0 }, '1Y'),
    ).toEqual([]);
  });
});
