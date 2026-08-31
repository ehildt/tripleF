import { describe, expect, it } from 'vitest';

import { mapLinkRowToEdge } from './map-link-row-to-edge.helper.js';

describe('mapLinkRowToEdge', () => {
  it('projects a link row into the edge shape', () => {
    expect(
      mapLinkRowToEdge({
        source: 'a',
        target: 'b',
        score: 0.8,
        kind: 'semantic',
      }),
    ).toEqual({ source: 'a', target: 'b', score: 0.8, kind: 'semantic' });
  });
});
