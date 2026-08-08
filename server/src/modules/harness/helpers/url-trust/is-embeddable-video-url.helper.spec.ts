import { describe, expect, it } from 'vitest';

import { isEmbeddableVideoUrl } from './is-embeddable-video-url.helper.js';

describe('isEmbeddableVideoUrl', () => {
  it('accepts YouTube URLs', () => {
    expect(isEmbeddableVideoUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      true,
    );
    expect(isEmbeddableVideoUrl('https://youtu.be/abc123')).toBe(true);
  });

  it('accepts Vimeo URLs', () => {
    expect(isEmbeddableVideoUrl('https://vimeo.com/123456')).toBe(true);
    expect(isEmbeddableVideoUrl('https://player.vimeo.com/video/123456')).toBe(
      true,
    );
  });

  it('rejects Instagram URLs', () => {
    expect(isEmbeddableVideoUrl('https://www.instagram.com/reel/abc123/')).toBe(
      false,
    );
  });

  it('rejects hosts the dashboard cannot embed', () => {
    expect(isEmbeddableVideoUrl('https://www.tiktok.com/@x/video/123')).toBe(
      false,
    );
    expect(isEmbeddableVideoUrl('https://twitter.com/x/status/123')).toBe(
      false,
    );
    expect(isEmbeddableVideoUrl('https://www.twitch.tv/videos/123')).toBe(
      false,
    );
  });

  it('rejects malformed URLs', () => {
    expect(isEmbeddableVideoUrl('not-a-url')).toBe(false);
    expect(isEmbeddableVideoUrl('')).toBe(false);
  });

  it('rejects malformed YouTube URLs with injected hostnames', () => {
    expect(
      isEmbeddableVideoUrl(
        'https://www.youtube.com/watch?．com/watch?v=vbzWnYomOm8',
      ),
    ).toBe(false);
    expect(
      isEmbeddableVideoUrl(
        'https://www.youtube.com/watch?domain.com/watch?v=abc123',
      ),
    ).toBe(false);
    expect(
      isEmbeddableVideoUrl(
        'https://www.youtube.com/watch?v=abc123&other=https://evil.com',
      ),
    ).toBe(false);
  });
});
