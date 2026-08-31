import { describe, expect, it } from 'vitest';

import { mapPassageToChunk } from './map-passage-to-chunk.helper.js';

describe('mapPassageToChunk', () => {
  it('projects a merged passage into the selected-chunk shape', () => {
    expect(
      mapPassageToChunk({
        url: 'https://example.com',
        title: 'Title',
        content: 'Body',
        score: 0.7,
      }),
    ).toEqual({
      url: 'https://example.com',
      title: 'Title',
      content: 'Body',
      score: 0.7,
      sourceType: 'content',
    });
  });
});
