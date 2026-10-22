import { describe, expect, it } from 'vitest';

import type { EodhdUserInfo } from '../../../stock-data/providers/eodhd/eodhd-client.js';

import { toEodhdCapabilities } from './to-eodhd-capabilities.helper.js';

describe('toEodhdCapabilities', () => {
  it('degrades to an empty capability snapshot for an empty payload', () => {
    const capabilities = toEodhdCapabilities({});

    expect(capabilities.plan).toBeUndefined();
    expect(capabilities.availableDataFeeds).toEqual([]);
    expect(Object.values(capabilities.endpoints).some(Boolean)).toBe(false);
    expect(Number.isNaN(Date.parse(capabilities.checkedAt ?? ''))).toBe(false);
  });

  it('carries the account fields through unchanged', () => {
    const info: EodhdUserInfo = {
      name: 'Ada',
      email: 'ada@example.com',
      subscriptionType: 'eod',
      subscriptionMode: 'monthly',
      paymentMethod: 'card',
      apiRequests: 7,
      apiRequestsDate: '2026-01-02',
      dailyRateLimit: 20,
      extraLimit: 3,
    };

    expect(toEodhdCapabilities(info)).toMatchObject({
      ...info,
      plan: 'Free',
      availableDataFeeds: [],
    });
  });

  it('derives the plan label and endpoint switchboard from the payload', () => {
    const capabilities = toEodhdCapabilities({
      dailyRateLimit: 100_000,
      availableDataFeeds: ['Search API', 'News API'],
    });

    expect(capabilities.plan).toBe(`${(100_000).toLocaleString()} calls / day`);
    expect(capabilities.endpoints).toMatchObject({
      search: true,
      news: true,
      quote: false,
      technical: false,
    });
    expect(capabilities.availableDataFeeds).toEqual(['Search API', 'News API']);
  });
});
