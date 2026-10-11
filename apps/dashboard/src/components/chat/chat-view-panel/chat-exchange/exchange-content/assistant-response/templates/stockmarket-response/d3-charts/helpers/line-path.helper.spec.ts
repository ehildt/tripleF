import { describe, expect, it } from 'vitest';

import { linePath } from './line-path.helper';

describe('linePath', () => {
  const points = [
    { x: 0, high: 10, low: 5, close: 7 },
    { x: 1, high: 10, low: 5, close: 7 },
    { x: 2, high: 10, low: 5, close: 7 },
  ];

  it('builds an M/L path through the y coordinates', () => {
    expect(linePath(points, (p) => p.close)).toBe('M 0 7 L 1 7 L 2 7');
  });

  it('returns an empty string for no points', () => {
    expect(linePath([], (p) => p.close)).toBe('');
  });
});
