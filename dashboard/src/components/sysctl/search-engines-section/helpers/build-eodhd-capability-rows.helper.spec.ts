import { describe, expect, it } from 'vitest';

import { buildEodhdCapabilityRows } from './build-eodhd-capability-rows.helper';

describe('buildEodhdCapabilityRows', () => {
  it('returns an empty list without a capabilities snapshot', () => {
    expect(buildEodhdCapabilityRows(undefined)).toEqual([]);
  });

  it('renders plan, usage, and quota rows', () => {
    const rows = buildEodhdCapabilityRows({
      plan: 'pro',
      dailyRateLimit: 1000,
      apiRequests: 250,
      extraLimit: 50,
      endpoints: {
        search: true,
        quote: true,
        history: true,
        technical: true,
        news: true,
        fundamentals: true,
      },
    });
    expect(rows).toEqual([
      { icon: expect.anything(), label: 'Plan', value: 'pro' },
      { icon: expect.anything(), label: 'Daily API calls', value: '1,000' },
      { icon: expect.anything(), label: 'Calls used today', value: '250' },
      { icon: expect.anything(), label: 'Quota remaining', value: '750' },
      { icon: expect.anything(), label: 'Extra calls', value: '50' },
    ]);
  });

  it('clamps quota remaining at zero', () => {
    const rows = buildEodhdCapabilityRows({
      plan: 'pro',
      dailyRateLimit: 100,
      apiRequests: 500,
      endpoints: {
        search: true,
        quote: true,
        history: true,
        technical: true,
        news: true,
        fundamentals: true,
      },
    });
    expect(rows.find((row) => row.label === 'Quota remaining')?.value).toBe(
      '0',
    );
  });

  it('omits quota and extra-call rows when the fields are absent', () => {
    const rows = buildEodhdCapabilityRows({
      plan: 'pro',
      endpoints: {
        search: true,
        quote: true,
        history: true,
        technical: true,
        news: true,
        fundamentals: true,
      },
    });
    expect(rows.map((row) => row.label)).toEqual([
      'Plan',
      'Daily API calls',
      'Calls used today',
      'Quota remaining',
    ]);
  });
});
