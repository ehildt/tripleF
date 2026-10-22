import { describe, expect, it } from 'vitest';

import { buildConnectedPairs } from './build-connected-pairs.helper';

describe('buildConnectedPairs', () => {
  it('returns events without rooms as bare entries, sorted', () => {
    const pairs = buildConnectedPairs(new Set(['gamma', 'alpha']), new Map());

    expect(pairs).toEqual(['alpha', 'gamma']);
  });

  it('expands events with rooms into event::room pairs, sorted', () => {
    const pairs = buildConnectedPairs(
      new Set(['harness']),
      new Map([['harness', new Set(['room-b', 'room-a'])]]),
    );

    expect(pairs).toEqual(['harness::room-a', 'harness::room-b']);
  });

  it('mixes bare events and expanded rooms', () => {
    const pairs = buildConnectedPairs(
      new Set(['beta', 'alpha']),
      new Map([['beta', new Set(['r1'])]]),
    );

    expect(pairs).toEqual(['alpha', 'beta::r1']);
  });

  it('treats an empty room set as a bare event', () => {
    const pairs = buildConnectedPairs(
      new Set(['harness']),
      new Map([['harness', new Set()]]),
    );

    expect(pairs).toEqual(['harness']);
  });
});
