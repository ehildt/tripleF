import { describe, expect, it } from 'vitest';

import { mapAggregatedGroup } from './map-aggregated-group.helper.js';

const group = [
  { date: '2025-01-06', open: 10, high: 20, low: 5, close: 15, volume: 100 },
  { date: '2025-01-07', open: 15, high: 25, low: 10, close: 20, volume: 200 },
];

describe('mapAggregatedGroup', () => {
  it('aggregates a weekly group using the first bar date', () => {
    expect(mapAggregatedGroup(['2025-W02', group], 'w')).toEqual({
      date: '2025-01-06',
      open: 10,
      high: 25,
      low: 5,
      close: 20,
      volume: 300,
    });
  });

  it('aggregates a monthly group using the key as the date', () => {
    expect(mapAggregatedGroup(['2025-01', group], 'm')).toEqual({
      date: '2025-01-01',
      open: 10,
      high: 25,
      low: 5,
      close: 20,
      volume: 300,
    });
  });
});
