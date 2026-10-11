import { describe, expect, it } from 'vitest';

import { isPivotHigh } from './is-pivot-high.helper';

describe('isPivotHigh', () => {
  const history = [
    { time: 'a', high: 10, low: 5 },
    { time: 'b', high: 10, low: 5 },
    { time: 'c', high: 10, low: 5 },
    { time: 'd', high: 15, low: 5 },
    { time: 'e', high: 10, low: 5 },
    { time: 'f', high: 10, low: 5 },
    { time: 'g', high: 10, low: 5 },
  ];

  it('returns true when the bar is the highest in its window', () => {
    expect(isPivotHigh(history, 3)).toBe(true);
  });

  it('returns false when a neighbour is higher or equal', () => {
    const withTie = [...history];
    withTie[4] = { time: 'e', high: 15, low: 5 };
    expect(isPivotHigh(withTie, 3)).toBe(false);
  });
});
