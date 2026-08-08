import { describe, expect, it } from 'vitest';

import { computeMacd } from './compute-macd.helper.js';

describe('computeMacd', () => {
  it('returns all-null lines for a series shorter than the slow period', () => {
    const closes = Array.from({ length: 20 }, (_, i) => i + 1);
    const { macd, signal, histogram } = computeMacd(closes);
    expect(macd).toHaveLength(20);
    expect(macd.every((v) => v === null)).toBe(true);
    expect(signal.every((v) => v === null)).toBe(true);
    expect(histogram.every((v) => v === null)).toBe(true);
  });

  it('produces a zero macd line for a constant series', () => {
    const closes = Array(40).fill(10);
    const { macd, signal, histogram } = computeMacd(closes);
    // Both EMAs converge to 10, so macd/signal/histogram are 0 where present.
    for (let i = 0; i < closes.length; i++) {
      if (macd[i] !== null) expect(macd[i]).toBeCloseTo(0);
      if (signal[i] !== null) expect(signal[i]).toBeCloseTo(0);
      if (histogram[i] !== null) expect(histogram[i]).toBeCloseTo(0);
    }
  });

  it('computes macd as fast EMA minus slow EMA', () => {
    const closes = Array.from({ length: 40 }, (_, i) => i + 1);
    const { macd, signal, histogram } = computeMacd(closes);
    expect(macd).toHaveLength(40);
    // macd is null until the slow EMA (period 26) fills at index 25.
    expect(macd[24]).toBeNull();
    expect(macd[25]).not.toBeNull();
    // signal lags macd by the signal period (9).
    expect(signal[33]).not.toBeNull();
    // histogram is macd minus signal where both exist.
    expect(histogram[33]).toBeCloseTo(macd[33]! - signal[33]!);
  });
});
