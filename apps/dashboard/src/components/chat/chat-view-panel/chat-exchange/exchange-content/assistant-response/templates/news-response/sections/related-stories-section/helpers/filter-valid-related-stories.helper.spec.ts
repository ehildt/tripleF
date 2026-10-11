import { describe, expect, it } from 'vitest';

import { filterValidRelatedStories } from './filter-valid-related-stories.helper';

describe('filterValidRelatedStories', () => {
  it('keeps image-backed stories with a link or title', () => {
    expect(
      filterValidRelatedStories([
        { imageUrl: 'https://x/i.jpg', url: 'https://x.com' },
        { imageUrl: 'https://x/i2.jpg', title: 'T' },
      ]),
    ).toEqual([
      { imageUrl: 'https://x/i.jpg', url: 'https://x.com' },
      { imageUrl: 'https://x/i2.jpg', title: 'T' },
    ]);
  });

  it('drops stories without an image', () => {
    expect(filterValidRelatedStories([{ title: 'T' }])).toEqual([]);
  });

  it('drops image-backed stories without a link or title', () => {
    expect(
      filterValidRelatedStories([{ imageUrl: 'https://x/i.jpg' }]),
    ).toEqual([]);
  });

  it('returns an empty list for undefined input', () => {
    expect(filterValidRelatedStories(undefined)).toEqual([]);
  });
});
