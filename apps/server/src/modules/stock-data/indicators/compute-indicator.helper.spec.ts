import { describe, expect, it } from 'vitest';

import { computeIndicator } from './compute-indicator.helper.js';
import type { OhlcBar } from './indicators.types.js';

const bars: OhlcBar[] = Array.from({ length: 60 }, (_, i) => {
  const close = i + 1;
  return {
    time: `2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String(
      (i % 28) + 1,
    ).padStart(2, '0')}`,
    open: close - 1,
    high: close + 1,
    low: close - 1,
    close,
  };
});

describe('computeIndicator', () => {
  it('maps single-series functions to points + latestValue', () => {
    for (const fn of ['sma', 'ema', 'rsi', 'atr'] as const) {
      const result = computeIndicator(bars, fn);
      expect(result.points.length).toBeGreaterThan(0);
      expect(result.points[0]).toHaveProperty('time');
      expect(result.points[0]).toHaveProperty('value');
      expect(typeof result.summary.latestValue).toBe('number');
    }
  });

  it('adds signal and histogram to the macd summary', () => {
    const result = computeIndicator(bars, 'macd');
    expect(result.points.length).toBeGreaterThan(0);
    expect(typeof result.summary.latestValue).toBe('number');
    expect(typeof result.summary.latestSignal).toBe('number');
    expect(typeof result.summary.latestHistogram).toBe('number');
  });

  it('adds upper and lower bands to the bbands summary', () => {
    const result = computeIndicator(bars, 'bbands');
    expect(result.points.length).toBeGreaterThan(0);
    expect(typeof result.summary.latestValue).toBe('number');
    expect(typeof result.summary.latestUpper).toBe('number');
    expect(typeof result.summary.latestLower).toBe('number');
  });

  it('adds +DI and -DI to the adx summary', () => {
    const result = computeIndicator(bars, 'adx');
    expect(result.points.length).toBeGreaterThan(0);
    expect(typeof result.summary.latestValue).toBe('number');
    expect(typeof result.summary.latestPlusDi).toBe('number');
    expect(typeof result.summary.latestMinusDi).toBe('number');
  });

  it('adds %D to the stochastic summary', () => {
    const result = computeIndicator(bars, 'stochastic');
    expect(result.points.length).toBeGreaterThan(0);
    expect(typeof result.summary.latestValue).toBe('number');
    expect(typeof result.summary.latestD).toBe('number');
  });

  it('returns empty points for an empty series', () => {
    const result = computeIndicator([], 'sma');
    expect(result.points).toEqual([]);
    expect(result.summary.latestValue).toBeUndefined();
  });
});
