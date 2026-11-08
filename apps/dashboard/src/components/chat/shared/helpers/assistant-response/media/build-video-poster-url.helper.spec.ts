import { describe, expect, it } from 'vitest';

import { buildVideoPosterUrl } from './build-video-poster-url.helper';

describe('buildVideoPosterUrl', () => {
  it('returns the best candidate', () => {
    expect(
      buildVideoPosterUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
  });

  it('returns null when there are no candidates', () => {
    expect(buildVideoPosterUrl('https://example.com/page')).toBeNull();
  });
});
