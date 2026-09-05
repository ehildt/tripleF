import { describe, expect, it } from 'vitest';

import { mapPointToLedgerRow } from './map-point-to-ledger-row.helper.js';

describe('mapPointToLedgerRow', () => {
  it('projects a point into a ledger row', () => {
    expect(
      mapPointToLedgerRow({ id: 'id1', text: 'hello' }, 'p1', 'user', 'r1'),
    ).toEqual({
      memoryPartition: 'p1',
      pointId: 'id1',
      role: 'user',
      text: 'hello',
      requestId: 'r1',
    });
  });
});
