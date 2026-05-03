import { describe, expect, it } from 'vitest';

import { isVideoUrl } from './is-video-url.helper';

describe('isVideoUrl', () => {
  it('returns true for known video hosts', () => {
    expect(isVideoUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
    expect(isVideoUrl('https://youtu.be/abc123')).toBe(true);
    expect(isVideoUrl('https://vimeo.com/123456')).toBe(true);
    expect(isVideoUrl('https://player.vimeo.com/video/123456')).toBe(true);
    expect(isVideoUrl('https://www.dailymotion.com/video/x123abc')).toBe(true);
    expect(isVideoUrl('https://dai.ly/x123abc')).toBe(true);
    expect(
      isVideoUrl('https://www.loom.com/share/abcdef1234567890abcdef1234567890'),
    ).toBe(true);
    expect(isVideoUrl('https://fast.wistia.net/embed/iframe/abcd1234')).toBe(
      true,
    );
  });

  it('returns true for direct video file extensions', () => {
    expect(isVideoUrl('https://example.com/clip.mp4')).toBe(true);
    expect(isVideoUrl('https://example.com/clip.webm?token=abc')).toBe(true);
  });

  it('returns false for blocked social platforms', () => {
    expect(isVideoUrl('https://www.instagram.com/reel/abc123')).toBe(false);
    expect(isVideoUrl('https://www.tiktok.com/@x/video/123')).toBe(false);
    expect(isVideoUrl('https://twitter.com/x/status/123')).toBe(false);
    expect(isVideoUrl('https://www.facebook.com/video/123')).toBe(false);
    expect(isVideoUrl('https://www.twitch.tv/videos/123')).toBe(false);
  });

  it('returns false for non-video discussion pages', () => {
    expect(
      isVideoUrl('https://www.reddit.com/r/gaming/comments/abc123/title/'),
    ).toBe(false);
    expect(isVideoUrl('https://example.com/article.html')).toBe(false);
    expect(isVideoUrl('https://example.com/image.jpg')).toBe(false);
  });

  it('returns false for malformed YouTube URLs with injected hostnames', () => {
    expect(
      isVideoUrl('https://www.youtube.com/watch?．com/watch?v=vbzWnYomOm8'),
    ).toBe(false);
    expect(
      isVideoUrl('https://www.youtube.com/watch?domain.com/watch?v=abc123'),
    ).toBe(false);
    expect(
      isVideoUrl(
        'https://www.youtube.com/watch?v=abc123&other=https://evil.com',
      ),
    ).toBe(false);
  });

  it('returns false for empty or malformed input', () => {
    expect(isVideoUrl('')).toBe(false);
    expect(isVideoUrl('not-a-url')).toBe(false);
  });
});
