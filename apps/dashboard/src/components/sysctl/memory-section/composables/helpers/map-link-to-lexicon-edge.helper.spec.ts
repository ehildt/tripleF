import { describe, expect, it } from 'vitest';

import { mapLinkToLexiconEdge } from './map-link-to-lexicon-edge.helper';

describe('mapLinkToLexiconEdge', () => {
  it('projects a link into the lexicon edge shape', () => {
    expect(
      mapLinkToLexiconEdge({ source: 'a', target: 'b', score: 0.8 }),
    ).toEqual({ source: 'a', target: 'b', type: 'semantic', score: 0.8 });
  });
});
