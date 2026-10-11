import { describe, expect, it } from 'vitest';

import { isPivotLow } from './is-pivot-low.helper';

describe('isPivotLow', () => {
  const history = [
    { time: 'a', high: 10, low: 8 },
    { time: 'b', high: 10, low: 8 },
    { time: 'c', high: 10, low: 8 },
    { time: 'd', high: 10, low: 5 },
    { time: 'e', high: 10, low: 8 },
    { time: 'f', high: 10, low: 8 },
    { time: 'g', high: 10, low: 8 },
  ];

  it('returns true when the bar is the lowest in its window', () => {
    expect(isPivotLow(history, 3)).toBe(true);
  });

  it('returns false when a neighbour is lower or equal', () => {
    const withTie = [...history];
    withTie[4] = { time: 'e', high: 10, low: 5 };
    expect(isPivotLow(withTie, 3)).toBe(false);
  });
});
