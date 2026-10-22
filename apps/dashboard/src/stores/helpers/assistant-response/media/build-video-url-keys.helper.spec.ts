import { describe, expect, it } from 'vitest';

import { buildVideoUrlKeys } from './build-video-url-keys.helper';

describe('buildVideoUrlKeys', () => {
  it('returns a normalized URL plus the canonical provider identity', () => {
    const keys = buildVideoUrlKeys(
      'HTTPS://www.YouTube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(keys[0]).toBe('youtube.com/watch?v=dqw4w9wgxcq');
    expect(keys).toContain('youtube:dQw4w9WgXcQ');
  });

  it('returns only the normalized URL for unsupported providers', () => {
    expect(buildVideoUrlKeys('https://example.com/video.mp4')).toEqual([
      'example.com/video.mp4',
    ]);
  });
});
