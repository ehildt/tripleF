import { describe, expect, it } from 'vitest';

import {
  buildEodhdSourceStatus,
  EODHD_ENDPOINT_ICONS,
} from './build-eodhd-source-status.helper';

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
        icon: EODHD_ENDPOINT_ICONS.search,
      },
      {
        key: 'history',
        label: 'End-of-day OHLCV price history',
        available: true,
        icon: EODHD_ENDPOINT_ICONS.history,
      },
      {
        key: 'news',
        label: 'Company financial news',
        available: true,
        icon: EODHD_ENDPOINT_ICONS.news,
      },
      {
        key: 'quote',
        label: 'Live (delayed) quote snapshot',
        available: false,
        icon: EODHD_ENDPOINT_ICONS.quote,
      },
      {
        key: 'technical',
        label: 'Technical indicators (RSI, MACD, ADX)',
        available: false,
        icon: EODHD_ENDPOINT_ICONS.technical,
      },
      {
        key: 'intraday',
        label: 'Intraday volume profile',
        available: false,
        icon: EODHD_ENDPOINT_ICONS.intraday,
      },
      {
        key: 'fundamentals',
        label: 'Company fundamentals and valuation',
        available: false,
        icon: EODHD_ENDPOINT_ICONS.fundamentals,
      },
    ]);
  });
});
