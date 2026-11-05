import { describe, expect, it } from 'vitest';

import type { MarketDailyBar } from '../market-data.types.js';

import { computePriceExtremes } from './compute-price-extremes.helper.js';

const bar = (date: string, high: number, low: number): MarketDailyBar =>
  ({ date, high, low, open: low, close: high, volume: 1 }) as MarketDailyBar;

describe('computePriceExtremes', () => {
  it('returns null for an empty window', () => {
    expect(computePriceExtremes([])).toBeNull();
  });

  it('returns the single bar as both extremes', () => {
    expect(computePriceExtremes([bar('2025-01-02', 110, 90)])).toEqual({
      high: { value: 110, date: '2025-01-02' },
      low: { value: 90, date: '2025-01-02' },
    });
  });

  it('finds the highest high and lowest low across the window', () => {
    const bars = [
      bar('2025-01-02', 100, 95),
      bar('2025-01-03', 120, 98),
      bar('2025-01-04', 105, 80),
      bar('2025-01-05', 110, 90),
    ];

    expect(computePriceExtremes(bars)).toEqual({
      high: { value: 120, date: '2025-01-03' },
      low: { value: 80, date: '2025-01-04' },
    });
  });

  it('keeps the first occurrence when extremes tie', () => {
    const bars = [bar('2025-01-02', 120, 80), bar('2025-01-03', 120, 80)];

    expect(computePriceExtremes(bars)).toEqual({
      high: { value: 120, date: '2025-01-02' },
      low: { value: 80, date: '2025-01-02' },
    });
  });

  it('tracks high and low that occur on different days', () => {
    const bars = [bar('2025-01-02', 100, 50), bar('2025-01-03', 200, 150)];

    expect(computePriceExtremes(bars)).toEqual({
      high: { value: 200, date: '2025-01-03' },
      low: { value: 50, date: '2025-01-02' },
    });
  });
});
