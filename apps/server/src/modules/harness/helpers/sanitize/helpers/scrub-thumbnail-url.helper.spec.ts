import { describe, expect, it } from 'vitest';

import { scrubThumbnailUrl } from './scrub-thumbnail-url.helper.js';

describe('scrubThumbnailUrl', () => {
  it('blanks a broken thumbnail url', () => {
    expect(
      scrubThumbnailUrl(
        { thumbnailUrl: 'https://broken.com/t.jpg' },
        new Set(['https://broken.com/t.jpg']),
      ),
    ).toEqual({ thumbnailUrl: '' });
  });

  it('keeps a valid thumbnail url', () => {
    const item = { thumbnailUrl: 'https://ok.com/t.jpg' };
    expect(scrubThumbnailUrl(item, new Set())).toBe(item);
  });
});
