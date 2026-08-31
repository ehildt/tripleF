import { describe, expect, it } from 'vitest';

import { mapLinkToEdge } from './map-link-to-edge.helper';

describe('mapLinkToEdge', () => {
  it('projects a semantic link into the edge shape', () => {
    expect(
      mapLinkToEdge({ source: 'a', target: 'b', score: 0.8, kind: 'semantic' }),
    ).toEqual({
      source: 'a',
      target: 'b',
      type: 'semantic',
      score: 0.8,
      suggested: undefined,
    });
  });

  it('marks a topical link as suggested', () => {
    expect(
      mapLinkToEdge({ source: 'a', target: 'b', score: 0.8, kind: 'topical' })
        .suggested,
    ).toBe(true);
  });
});
