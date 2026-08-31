import { describe, expect, it } from 'vitest';

import { blankReusedStoryThumbnail } from './blank-reused-story-thumbnail.helper.js';

describe('blankReusedStoryThumbnail', () => {
  it('keeps a story whose image is allowed and unspent', () => {
    const used = new Set<string>();
    const result = blankReusedStoryThumbnail(
      { imageUrl: 'https://allowed.com/img.jpg' },
      new Set(['https://allowed.com/img.jpg']),
      used,
    );
    expect(result).toEqual({
      item: { imageUrl: 'https://allowed.com/img.jpg' },
      changed: false,
    });
    expect(used.has('https://allowed.com/img.jpg')).toBe(true);
  });

  it('blanks a story whose image is not allowed', () => {
    const result = blankReusedStoryThumbnail(
      { imageUrl: 'https://unvetted.com/img.jpg' },
      new Set(['https://allowed.com/img.jpg']),
      new Set(),
    );
    expect(result).toEqual({
      item: { imageUrl: '' },
      changed: true,
    });
  });

  it('returns non-object items unchanged', () => {
    expect(blankReusedStoryThumbnail(null, new Set(), new Set())).toEqual({
      item: null,
      changed: false,
    });
  });
});
