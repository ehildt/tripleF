import { describe, expect, it } from 'vitest';

import { buildEodhdFallbackInput } from './build-eodhd-fallback-input.helper.js';

describe('buildEodhdFallbackInput', () => {
  it('builds a quote input', () => {
    expect(buildEodhdFallbackInput('eodhdQuote', 'AAPL')).toEqual({
      tickers: ['AAPL'],
    });
  });

  it('builds a history input', () => {
    expect(buildEodhdFallbackInput('eodhdHistory', 'AAPL')).toEqual({
      ticker: 'AAPL',
      period: 'd',
    });
  });

  it('builds a technical input', () => {
    expect(buildEodhdFallbackInput('eodhdTechnical', 'AAPL')).toEqual({
      ticker: 'AAPL',
      function: 'rsi',
    });
  });

  it('builds a news input', () => {
    expect(buildEodhdFallbackInput('eodhdNews', 'AAPL')).toEqual({
      ticker: 'AAPL',
      limit: 6,
    });
  });

  it('builds a fundamentals input', () => {
    expect(buildEodhdFallbackInput('eodhdFundamentals', 'AAPL')).toEqual({
      ticker: 'AAPL',
    });
  });

  it('builds an intraday input', () => {
    expect(buildEodhdFallbackInput('eodhdIntraday', 'AAPL')).toEqual({
      ticker: 'AAPL',
      interval: '1h',
      days: 30,
    });
  });

  it('returns undefined for unknown tools', () => {
    expect(buildEodhdFallbackInput('webSearch', 'AAPL')).toBe(undefined);
  });
});
