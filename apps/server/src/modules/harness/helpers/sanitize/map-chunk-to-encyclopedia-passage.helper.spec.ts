import { describe, expect, it } from 'vitest';

import { mapChunkToEncyclopediaPassage } from './map-chunk-to-encyclopedia-passage.helper.js';

describe('mapChunkToEncyclopediaPassage', () => {
  it('projects a past chunk into the encyclopedia-passage shape', () => {
    expect(
      mapChunkToEncyclopediaPassage({
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
