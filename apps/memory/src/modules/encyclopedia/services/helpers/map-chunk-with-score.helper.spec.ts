import { describe, expect, it } from 'vitest';

import { mapChunkWithScore } from './map-chunk-with-score.helper.js';

describe('mapChunkWithScore', () => {
  it('stamps a chunk with its cosine score', () => {
    expect(mapChunkWithScore({ content: 'Body' }, 1, [0.5, 0.9])).toEqual({
      content: 'Body',
      score: 0.9,
    });
  });

  it('falls back to zero when the score is missing', () => {
    expect(mapChunkWithScore({ content: 'Body' }, 5, [0.5])).toEqual({
      content: 'Body',
      score: 0,
    });
  });
});
