import { describe, expect, it } from 'vitest';

import { deriveEodhdEndpoints } from './derive-eodhd-endpoints.helper.js';

describe('deriveEodhdEndpoints', () => {
  it('reports every endpoint as unavailable without feeds', () => {
    expect(deriveEodhdEndpoints([])).toEqual({
      search: false,
      quote: false,
      history: false,
      technical: false,
      intraday: false,
      news: false,
      fundamentals: false,
    });
  });

  it('unlocks an endpoint from any of its feeds', () => {
    expect(deriveEodhdEndpoints(['Live (delayed) Data API']).quote).toBe(true);
    expect(deriveEodhdEndpoints(['Bulk Live (delayed) Data API']).quote).toBe(
      true,
    );
  });

  it('ignores feeds that map to no modeled endpoint', () => {
    const endpoints = deriveEodhdEndpoints(['Some Retired Feed']);

    expect(Object.values(endpoints).some(Boolean)).toBe(false);
  });

  it('maps each modeled feed onto exactly its endpoint', () => {
    expect(deriveEodhdEndpoints(['Fundamental Data'])).toMatchObject({
      fundamentals: true,
      history: false,
      search: false,
    });
  });
});
