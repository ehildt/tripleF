import { describe, expect, it } from 'vitest';

import { mapGroupToPendingPartition } from './map-group-to-pending-partition.helper.js';

describe('mapGroupToPendingPartition', () => {
  it('projects a group-by row into the pending-partition shape', () => {
    expect(
      mapGroupToPendingPartition({
        memoryPartition: 'p1',
        _count: { _all: 3 },
      }),
    ).toEqual({ memoryPartition: 'p1', pending: 3 });
  });
});
