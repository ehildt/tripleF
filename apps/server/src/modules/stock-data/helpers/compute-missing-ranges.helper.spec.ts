import { describe, expect, it } from 'vitest';

import { computeMissingRanges } from './compute-missing-ranges.helper.js';

describe('computeMissingRanges', () => {
  it('returns the full target when nothing is covered', () => {
    expect(
      computeMissingRanges({ from: '2024-01-01', to: '2024-01-10' }, []),
    ).toEqual([{ from: '2024-01-01', to: '2024-01-10' }]);
  });

  it('returns an empty array when the target is fully covered', () => {
    expect(
      computeMissingRanges({ from: '2024-01-01', to: '2024-01-10' }, [
        { from: '2024-01-01', to: '2024-01-10' },
      ]),
    ).toEqual([]);
  });

  it('splits around a covered middle range', () => {
    expect(
      computeMissingRanges({ from: '2024-01-01', to: '2024-01-10' }, [
        { from: '2024-01-03', to: '2024-01-05' },
      ]),
    ).toEqual([
      { from: '2024-01-01', to: '2024-01-02' },
      { from: '2024-01-06', to: '2024-01-10' },
    ]);
  });

  it('clips coverage that extends beyond the target', () => {
    expect(
      computeMissingRanges({ from: '2024-01-05', to: '2024-01-10' }, [
        { from: '2024-01-01', to: '2024-01-08' },
      ]),
    ).toEqual([{ from: '2024-01-09', to: '2024-01-10' }]);
  });

  it('ignores coverage entirely outside the target', () => {
    expect(
      computeMissingRanges({ from: '2024-01-05', to: '2024-01-10' }, [
        { from: '2024-01-01', to: '2024-01-03' },
      ]),
    ).toEqual([{ from: '2024-01-05', to: '2024-01-10' }]);
  });

  it('returns an empty array for an inverted target', () => {
    expect(
      computeMissingRanges({ from: '2024-01-10', to: '2024-01-01' }, []),
    ).toEqual([]);
  });
});
