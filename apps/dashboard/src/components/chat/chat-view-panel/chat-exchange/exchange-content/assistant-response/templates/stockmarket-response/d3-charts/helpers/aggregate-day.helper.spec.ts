import { describe, expect, it } from 'vitest';

import { aggregateDay } from './aggregate-day.helper';

describe('aggregateDay', () => {
  it('returns null when total amount is zero', () => {
    expect(aggregateDay([{ low: 0, high: 10, amount: 0 }])).toBeNull();
  });

  it('computes total, volume-weighted centroid, and spread', () => {
    expect(
      aggregateDay([
        { low: 0, high: 10, amount: 5 },
        { low: 10, high: 20, amount: 5 },
      ]),
    ).toEqual({ total: 10, centroid: 10, spread: 5 });
  });
});
