import { describe, expect, it } from 'vitest';

import { buildFundamentalEntries } from './build-fundamental-entries.helper';

describe('buildFundamentalEntries', () => {
  it('returns an empty list for undefined fundamentals', () => {
    expect(buildFundamentalEntries(undefined)).toEqual([]);
  });

  it('passes already-formatted string values through untouched', () => {
    const entries = buildFundamentalEntries({
      name: 'NVIDIA Corporation',
      marketCap: '$5.6T',
      peRatio: '45.2',
      profitMargin: '55%',
    });
    expect(entries).toEqual([
      { key: 'name', label: 'Name', value: 'NVIDIA Corporation' },
      { key: 'marketCap', label: 'Market Cap', value: '$5.6T' },
      { key: 'peRatio', label: 'P/E Ratio', value: '45.2' },
      { key: 'profitMargin', label: 'Profit Margin', value: '55%' },
    ]);
  });

  it('formats numeric values per field', () => {
    const entries = buildFundamentalEntries({
      marketCap: 5_600_000_000_000,
      revenue: 130_500_000_000,
      peRatio: 45.234,
      profitMargin: 0.55,
    });
    expect(entries).toEqual([
      { key: 'marketCap', label: 'Market Cap', value: '5.60T' },
      { key: 'peRatio', label: 'P/E Ratio', value: '45.23' },
      { key: 'revenue', label: 'Revenue', value: '130.50B' },
      { key: 'profitMargin', label: 'Profit Margin', value: '0.55%' },
    ]);
  });

  it('skips empty and missing fields', () => {
    const entries = buildFundamentalEntries({
      sector: 'Technology',
      industry: 'Semiconductors',
      marketCap: '',
      peRatio: undefined,
    });
    expect(entries).toEqual([
      { key: 'sector', label: 'Sector', value: 'Technology' },
      { key: 'industry', label: 'Industry', value: 'Semiconductors' },
    ]);
  });
});
