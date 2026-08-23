import { describe, expect, it } from 'vitest';

import { videoUrlKeys } from './video-url-keys.helper.js';

describe('videoUrlKeys', () => {
  it('returns the normalized url as the first key', () => {
    const keys = videoUrlKeys('https://www.youtube.com/watch?v=abc123def45');
    expect(keys[0]).toBe('youtube.com/watch?v=abc123def45');
  });

  it('adds a canonical provider identity for youtube', () => {
    const keys = videoUrlKeys('https://www.youtube.com/watch?v=abc123def45');
    expect(keys).toContain('youtube:abc123def45');
  });

  it('adds a canonical identity for vimeo', () => {
    const keys = videoUrlKeys('https://vimeo.com/123456789');
    expect(keys).toContain('vimeo:123456789');
  });

  it('returns only the normalized url for unsupported providers', () => {
    const keys = videoUrlKeys('https://example.com/video');
    expect(keys).toEqual(['example.com/video']);
  });
});
