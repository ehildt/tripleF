import { describe, expect, it } from 'vitest';

import { mapFrictionRowToEdge } from './map-friction-row-to-edge.helper.js';

describe('mapFrictionRowToEdge', () => {
  it('projects a row into the dashboard edge shape', () => {
    expect(
      mapFrictionRowToEdge({
        source: 'a',
        target: 'b',
        kind: 'contradiction',
        status: 'open',
        reason: 'conflict',
        resolution: null,
      } as never),
    ).toEqual({
      source: 'a',
      target: 'b',
      kind: 'contradiction',
      status: 'open',
      reason: 'conflict',
      resolution: undefined,
    });
  });

  it('omits reason and resolution when null', () => {
    expect(
      mapFrictionRowToEdge({
        source: 'a',
        target: 'b',
        kind: 'superseded',
        status: 'resolved',
        reason: null,
        resolution: null,
      } as never),
    ).toEqual({
      source: 'a',
      target: 'b',
      kind: 'superseded',
      status: 'resolved',
      reason: undefined,
      resolution: undefined,
    });
  });
});
