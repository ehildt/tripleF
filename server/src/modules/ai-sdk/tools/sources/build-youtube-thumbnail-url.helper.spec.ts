import { describe, expect, it } from 'vitest';

import { buildYoutubeThumbnailUrl } from './build-youtube-thumbnail-url.helper.js';

describe('buildYoutubeThumbnailUrl', () => {
  it('builds a thumbnail for a watch url', () => {
    expect(
      buildYoutubeThumbnailUrl('https://www.youtube.com/watch?v=abc123def45'),
    ).toBe('https://i.ytimg.com/vi/abc123def45/hqdefault.jpg');
  });

  it('builds a thumbnail for a youtu.be url', () => {
    expect(buildYoutubeThumbnailUrl('https://youtu.be/abc123def45')).toBe(
      'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg',
    );
  });

  it('builds a thumbnail for a shorts url', () => {
    expect(
      buildYoutubeThumbnailUrl('https://www.youtube.com/shorts/abc123def45'),
    ).toBe('https://i.ytimg.com/vi/abc123def45/hqdefault.jpg');
  });

  it('returns undefined for non-youtube urls', () => {
    expect(buildYoutubeThumbnailUrl('https://vimeo.com/123')).toBe(undefined);
  });

  it('returns undefined for an invalid id', () => {
    expect(buildYoutubeThumbnailUrl('https://youtu.be/too-short')).toBe(
      undefined,
    );
  });
});
