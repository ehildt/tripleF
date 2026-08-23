import { describe, expect, it } from 'vitest';

import type { MarketDailyBar } from '../market-data.types.js';

import { aggregateDailyBars } from './aggregate-daily-bars.helper.js';

const bars: MarketDailyBar[] = [
  { date: '2024-01-01', open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { date: '2024-01-02', open: 11, high: 13, low: 10, close: 12, volume: 200 },
  { date: '2024-01-03', open: 12, high: 15, low: 11, close: 14, volume: 300 },
  { date: '2024-02-01', open: 20, high: 22, low: 19, close: 21, volume: 400 },
];

describe('aggregateDailyBars', () => {
  it('aggregates monthly bars', () => {
    const result = aggregateDailyBars(bars, 'm');
    expect(result).toHaveLength(2);
    const jan = result[0];
    expect(jan.date).toBe('2024-01-01');
    expect(jan.open).toBe(10);
    expect(jan.high).toBe(15);
    expect(jan.low).toBe(9);
    expect(jan.close).toBe(14);
    expect(jan.volume).toBe(600);
  });

  it('aggregates weekly bars', () => {
    const result = aggregateDailyBars(bars, 'w');
    // 2024-01-01 is a Monday → all three January bars share one ISO week.
    expect(result).toHaveLength(2);
    expect(result[0].open).toBe(10);
    expect(result[0].high).toBe(15);
    expect(result[0].low).toBe(9);
    expect(result[0].close).toBe(14);
    expect(result[0].volume).toBe(600);
  });

  it('returns an empty array for no bars', () => {
    expect(aggregateDailyBars([], 'm')).toEqual([]);
  });
});
