import { describe, expect, it } from 'vitest';

import { mapEdgeToSimLink } from './map-edge-to-sim-link.helper';

describe('mapEdgeToSimLink', () => {
  it('builds a simulation link from an edge', () => {
    expect(
      mapEdgeToSimLink({ source: 'a', target: 'b', kind: 'inter', score: 0.8 }),
    ).toEqual({ source: 'a', target: 'b', kind: 'inter', score: 0.8 });
  });
});
