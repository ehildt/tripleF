import { describe, expect, it } from 'vitest';

import { buildBrightDataCapabilityRows } from './build-bright-data-capability-rows.helper';

describe('buildBrightDataCapabilityRows', () => {
  it('returns an empty list without a capabilities snapshot', () => {
    expect(buildBrightDataCapabilityRows(undefined)).toEqual([]);
  });

  it('renders status and balance rows', () => {
    const rows = buildBrightDataCapabilityRows({
      status: 'active',
      balance: 12.5,
      pendingCosts: 0.25,
    });
    expect(rows).toEqual([
      { icon: expect.anything(), label: 'Account status', value: 'active' },
      { icon: expect.anything(), label: 'Balance', value: '$12.50' },
      { icon: expect.anything(), label: 'Pending costs', value: '$0.25' },
    ]);
  });

  it('surfaces a billing permission error as a warning row', () => {
    const rows = buildBrightDataCapabilityRows({
      status: 'active',
      balanceError: 'permission',
    });
    expect(rows).toEqual([
      { icon: expect.anything(), label: 'Account status', value: 'active' },
      {
        icon: expect.anything(),
        label: 'Balance',
        value: 'Requires billing permission',
        tone: 'warning',
      },
    ]);
  });

  it('falls back to an em dash for a missing balance', () => {
    const rows = buildBrightDataCapabilityRows({ status: 'active' });
    expect(rows[1].value).toBe('—');
  });
});
