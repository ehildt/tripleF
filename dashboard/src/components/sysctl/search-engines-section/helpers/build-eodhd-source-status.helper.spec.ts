import { describe, expect, it } from 'vitest';

import { buildEodhdSourceStatus } from './build-eodhd-source-status.helper';

describe('buildEodhdSourceStatus', () => {
  it('returns an empty list without a capabilities snapshot', () => {
    expect(buildEodhdSourceStatus(undefined)).toEqual([]);
  });

  it('maps each endpoint to its availability, available first', () => {
    const statuses = buildEodhdSourceStatus({
      plan: 'pro',
      endpoints: {
        search: true,
        quote: false,
        history: true,
        technical: false,
        intraday: false,
        news: true,
        fundamentals: false,
      },
    });
    expect(statuses).toEqual([
      {
        key: 'search',
        label: 'Resolve company/index names to tickers',
        available: true,
      },
      {
        key: 'history',
        label: 'End-of-day OHLCV price history',
        available: true,
      },
      { key: 'news', label: 'Company financial news', available: true },
      {
        key: 'quote',
        label: 'Live (delayed) quote snapshot',
        available: false,
      },
      {
        key: 'technical',
        label: 'Technical indicators (RSI, MACD, ADX)',
        available: false,
      },
      {
        key: 'intraday',
        label: 'Intraday volume profile (per price band)',
        available: false,
      },
      {
        key: 'fundamentals',
        label: 'Company fundamentals and valuation',
        available: false,
      },
    ]);
  });
});
