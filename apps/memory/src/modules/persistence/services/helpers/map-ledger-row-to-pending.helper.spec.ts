import { describe, expect, it } from 'vitest';

import { mapLedgerRowToPending } from './map-ledger-row-to-pending.helper.js';

describe('mapLedgerRowToPending', () => {
  it('projects a ledger row into the pending-entry shape', () => {
    const createdAt = new Date('2025-01-01T00:00:00Z');
    expect(
      mapLedgerRowToPending({
        id: 'id1',
        memoryPartition: 'p1',
        pointId: 'pt1',
        role: 'user',
        text: 'hello',
        requestId: 'r1',
        createdAt,
        sweptAt: null,
      }),
    ).toEqual({
      id: 'id1',
      memoryPartition: 'p1',
      pointId: 'pt1',
      role: 'user',
      text: 'hello',
      requestId: 'r1',
      createdAt,
    });
  });
});
