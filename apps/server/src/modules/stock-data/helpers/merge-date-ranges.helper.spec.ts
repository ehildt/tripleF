import { describe, expect, it } from 'vitest';

import { mergeDateRanges } from './merge-date-ranges.helper.js';

describe('mergeDateRanges', () => {
  it('merges overlapping ranges', () => {
    expect(
      mergeDateRanges([
        { from: '2024-01-01', to: '2024-01-10' },
        { from: '2024-01-03', to: '2024-01-05' },
      ]),
    ).toEqual([{ from: '2024-01-01', to: '2024-01-10' }]);
  });

  it('merges directly adjacent ranges', () => {
    expect(
      mergeDateRanges([
        { from: '2024-01-01', to: '2024-01-05' },
        { from: '2024-01-06', to: '2024-01-10' },
      ]),
    ).toEqual([{ from: '2024-01-01', to: '2024-01-10' }]);
  });

  it('keeps non-adjacent ranges separate', () => {
    expect(
      mergeDateRanges([
        { from: '2024-01-01', to: '2024-01-05' },
        { from: '2024-01-07', to: '2024-01-10' },
      ]),
    ).toEqual([
      { from: '2024-01-01', to: '2024-01-05' },
      { from: '2024-01-07', to: '2024-01-10' },
    ]);
  });

  it('sorts unsorted input', () => {
    expect(
      mergeDateRanges([
        { from: '2024-01-10', to: '2024-01-12' },
        { from: '2024-01-01', to: '2024-01-03' },
      ]),
    ).toEqual([
      { from: '2024-01-01', to: '2024-01-03' },
      { from: '2024-01-10', to: '2024-01-12' },
    ]);
  });

  it('drops inverted ranges', () => {
    expect(
      mergeDateRanges([
        { from: '2024-01-10', to: '2024-01-01' },
        { from: '2024-01-02', to: '2024-01-04' },
      ]),
    ).toEqual([{ from: '2024-01-02', to: '2024-01-04' }]);
  });

  it('returns an empty array for no input', () => {
    expect(mergeDateRanges([])).toEqual([]);
  });
});
