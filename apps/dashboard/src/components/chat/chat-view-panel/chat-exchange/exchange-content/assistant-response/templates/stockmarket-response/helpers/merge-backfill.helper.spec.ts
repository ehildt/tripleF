import { describe, expect, it } from 'vitest';

import { mergeBackfill } from './merge-backfill.helper';

function point(time: string, close = 1): { time: string; close: number } {
  return { time, close };
}

describe('mergeBackfill', () => {
  it('returns the incoming bars when there is nothing existing', () => {
    const incoming = [point('2026-01-02'), point('2026-01-03')];
    expect(mergeBackfill([], incoming)).toEqual(incoming);
  });

  it('keeps existing bars when a day appears in both lists', () => {
    const existing = [point('2026-01-03', 5)];
    const incoming = [point('2026-01-03', 9), point('2026-01-04')];
    expect(mergeBackfill(existing, incoming)).toEqual([
      point('2026-01-03', 5),
      point('2026-01-04'),
    ]);
  });

  it('sorts the merged bars ascending by time', () => {
    const existing = [point('2026-01-05'), point('2026-01-02')];
    const incoming = [point('2026-01-04'), point('2026-01-01')];
    expect(mergeBackfill(existing, incoming).map((p) => p.time)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-04',
      '2026-01-05',
    ]);
  });
});
