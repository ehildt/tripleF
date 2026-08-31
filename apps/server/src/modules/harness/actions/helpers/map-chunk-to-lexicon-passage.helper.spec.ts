import { describe, expect, it } from 'vitest';

import { mapChunkToLexiconPassage } from './map-chunk-to-lexicon-passage.helper.js';

describe('mapChunkToLexiconPassage', () => {
  it('projects a past chunk into the lexicon-passage shape', () => {
    expect(
      mapChunkToLexiconPassage({
        url: 'https://example.com',
        title: 'T',
        content: 'Body',
        sourceType: 'content',
      }),
    ).toEqual({
      url: 'https://example.com',
      title: 'T',
      content: 'Body',
      sourceType: 'content',
    });
  });
});
