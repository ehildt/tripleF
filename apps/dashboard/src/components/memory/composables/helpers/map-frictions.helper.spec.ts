import { describe, expect, it } from 'vitest';

import type { MemoryFrictionRecord } from '@/api/memory.api';

import { mapFrictions } from './map-frictions.helper';

describe('mapFrictions', () => {
  it('keeps only open frictions and projects the warning-edge shape', () => {
    const records: MemoryFrictionRecord[] = [
      {
        source: 'a',
        target: 'b',
        kind: 'contradiction',
        status: 'open',
        reason: 'conflicting phone numbers',
      },
      {
        source: 'c',
        target: 'd',
        kind: 'outdated',
        status: 'resolved',
        reason: 'stale address',
        resolution: 'c won',
      },
      {
        source: 'e',
        target: 'f',
        kind: 'disagreement',
        status: 'dismissed',
      },
    ];

    expect(mapFrictions(records)).toEqual([
      { source: 'a', target: 'b', reason: 'conflicting phone numbers' },
    ]);
  });

  it('returns an empty list for no open frictions', () => {
    expect(mapFrictions([])).toEqual([]);
  });
});
