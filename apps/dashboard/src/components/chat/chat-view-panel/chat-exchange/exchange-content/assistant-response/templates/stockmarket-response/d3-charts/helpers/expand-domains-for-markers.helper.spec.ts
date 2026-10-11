import { describe, expect, it } from 'vitest';

import { expandDomainsForMarkers } from './expand-domains-for-markers.helper';

describe('expandDomainsForMarkers', () => {
  const domains = { price: [100, 200], volume: null };

  it('expands the top of the price domain for a marker above it', () => {
    const result = expandDomainsForMarkers(
      domains,
      [{ index: 0, price: 250 }],
      0,
      10,
    );
    expect(result.price[0]).toBe(100);
    expect(result.price[1]).toBe(255);
  });

  it('expands the bottom for a marker below it', () => {
    const result = expandDomainsForMarkers(
      domains,
      [{ index: 0, price: 50 }],
      0,
      10,
    );
    expect(result.price[0]).toBe(45);
    expect(result.price[1]).toBe(200);
  });

  it('ignores markers outside the visible window', () => {
    const result = expandDomainsForMarkers(
      domains,
      [{ index: 50, price: 250 }],
      0,
      10,
    );
    expect(result).toEqual(domains);
  });

  it('returns the domain unchanged for markers inside it', () => {
    const result = expandDomainsForMarkers(
      domains,
      [{ index: 0, price: 150 }],
      0,
      10,
    );
    expect(result).toEqual(domains);
  });
});
