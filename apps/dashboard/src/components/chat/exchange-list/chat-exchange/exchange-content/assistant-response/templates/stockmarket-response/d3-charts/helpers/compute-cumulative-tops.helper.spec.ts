import { describe, expect, it } from 'vitest';

import { computeCumulativeTops } from './compute-cumulative-tops.helper';

describe('computeCumulativeTops', () => {
  it('accumulates the series values in order', () => {
    expect(
      computeCumulativeTops({ time: '2026-01-02', values: [10, 20, 5] }),
    ).toEqual([10, 30, 35]);
  });

  it('clamps negative values to zero', () => {
    expect(
      computeCumulativeTops({ time: '2026-01-02', values: [10, -5, 5] }),
    ).toEqual([10, 10, 15]);
  });

  it('handles an empty day', () => {
    expect(computeCumulativeTops({ time: '2026-01-02', values: [] })).toEqual(
      [],
    );
  });
});
