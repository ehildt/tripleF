import { describe, expect, it } from 'vitest';

import { mapLinkToEncyclopediaEdge } from './map-link-to-encyclopedia-edge.helper';

describe('mapLinkToEncyclopediaEdge', () => {
  it('projects a link into the encyclopedia edge shape', () => {
    expect(
      mapLinkToEncyclopediaEdge({ source: 'a', target: 'b', score: 0.8 }),
    ).toEqual({ source: 'a', target: 'b', type: 'semantic', score: 0.8 });
  });
});
