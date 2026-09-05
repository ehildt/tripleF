import { describe, expect, it } from 'vitest';

import { buildSerperCapabilityRows } from './build-serper-capability-rows.helper';

describe('buildSerperCapabilityRows', () => {
  it('returns an empty list without a capabilities snapshot', () => {
    expect(buildSerperCapabilityRows(undefined)).toEqual([]);
  });

  it('renders credits and rate limit rows', () => {
    const rows = buildSerperCapabilityRows({
      remainingCredits: 1234,
      rateLimit: 60,
    });
    expect(rows).toEqual([
      { icon: expect.anything(), label: 'Credits remaining', value: '1,234' },
      { icon: expect.anything(), label: 'Requests / minute', value: '60' },
    ]);
  });

  it('falls back to an em dash for missing values', () => {
    const rows = buildSerperCapabilityRows({});
    expect(rows.map((row) => row.value)).toEqual(['—', '—']);
  });
});
