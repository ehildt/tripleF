import { describe, expect, it } from 'vitest';

import { extractImageSearchItems } from './extract-media-from-tools.helper.js';

describe('extractImageSearchItems', () => {
  it('flags Bright Data image results to skip the dimension check', () => {
    const items = extractImageSearchItems([
      {
        toolName: 'brightDataImageSearch',
        result: {
          results: [
            { imageUrl: 'https://upload.wikimedia.org/wikipedia/a.jpg' },
          ],
        },
      },
    ]);
    expect(items[0].imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/a.jpg',
    );
    expect(items[0].skipDimensionCheck).toBe(true);
  });

  it('does not flag Serper image results for the skip', () => {
    const items = extractImageSearchItems([
      {
        toolName: 'serperImageSearch',
        result: {
          results: [
            { imageUrl: 'https://upload.wikimedia.org/wikipedia/a.jpg' },
          ],
        },
      },
    ]);
    expect(items[0].skipDimensionCheck).toBe(false);
  });

  it('drops untrusted and duplicate image URLs regardless of engine', () => {
    const items = extractImageSearchItems([
      {
        toolName: 'brightDataImageSearch',
        result: {
          results: [
            // duplicate
            { imageUrl: 'https://upload.wikimedia.org/wikipedia/a.jpg' },
            // untrusted Google thumbnail proxy
            { imageUrl: 'https://encrypted-tbn0.gstatic.com/images?x=1' },
            { imageUrl: 'https://upload.wikimedia.org/wikipedia/a.jpg' },
          ],
        },
      },
    ]);
    expect(items).toHaveLength(1);
  });
});
