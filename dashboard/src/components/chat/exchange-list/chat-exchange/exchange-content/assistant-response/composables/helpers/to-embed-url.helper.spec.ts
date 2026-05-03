import { describe, expect, it } from 'vitest';

import { toEmbedUrl } from './to-embed-url.helper';

describe('toEmbedUrl', () => {
  it('converts youtube watch URLs to embed URLs', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
  });

  it('converts youtube short URLs to embed URLs', () => {
    expect(toEmbedUrl('https://youtu.be/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
  });

  it('converts youtube shorts URLs to embed URLs', () => {
    expect(toEmbedUrl('https://www.youtube.com/shorts/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
  });

  it('converts youtube live URLs to embed URLs', () => {
    expect(toEmbedUrl('https://www.youtube.com/live/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
  });

  it('converts legacy youtube inline player URLs to embed URLs', () => {
    expect(toEmbedUrl('https://www.youtube.com/v/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
    expect(toEmbedUrl('https://www.youtube.com/vi/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
    expect(toEmbedUrl('https://www.youtube.com/e/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
    expect(toEmbedUrl('https://www.youtube.com/watch?vi=3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
  });

  it('leaves existing youtube embed URLs unchanged', () => {
    expect(toEmbedUrl('https://www.youtube.com/embed/3tdfsBo9oiY')).toBe(
      'https://www.youtube.com/embed/3tdfsBo9oiY',
    );
  });

  it('converts vimeo page URLs to player URLs', () => {
    expect(toEmbedUrl('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    );
  });

  it('leaves vimeo player URLs unchanged', () => {
    expect(toEmbedUrl('https://player.vimeo.com/video/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    );
  });

  it('converts dailymotion URLs to embed URLs', () => {
    expect(toEmbedUrl('https://www.dailymotion.com/video/x123abc')).toBe(
      'https://www.dailymotion.com/embed/video/x123abc',
    );
    expect(toEmbedUrl('https://dai.ly/x123abc')).toBe(
      'https://www.dailymotion.com/embed/video/x123abc',
    );
  });

  it('converts loom share URLs to embed URLs', () => {
    expect(
      toEmbedUrl('https://www.loom.com/share/abcdef1234567890abcdef1234567890'),
    ).toBe('https://www.loom.com/embed/abcdef1234567890abcdef1234567890');
  });

  it('converts wistia URLs to embed URLs', () => {
    expect(toEmbedUrl('https://fast.wistia.net/embed/iframe/abcd1234')).toBe(
      'https://fast.wistia.net/embed/iframe/abcd1234',
    );
    expect(toEmbedUrl('https://home.wistia.com/medias/abcd1234')).toBe(
      'https://fast.wistia.net/embed/iframe/abcd1234',
    );
  });

  it('rejects blocked social platforms', () => {
    expect(toEmbedUrl('https://www.instagram.com/p/fA9uwTtkSN/')).toBeNull();
    expect(toEmbedUrl('https://www.instagram.com/reel/ABC123_/')).toBeNull();
    expect(toEmbedUrl('https://www.tiktok.com/@x/video/123')).toBeNull();
    expect(toEmbedUrl('https://twitter.com/x/status/123')).toBeNull();
    expect(toEmbedUrl('https://www.facebook.com/video/123')).toBeNull();
    expect(toEmbedUrl('https://www.twitch.tv/videos/123')).toBeNull();
  });

  it('returns null for YouTube channel and playlist URLs', () => {
    expect(
      toEmbedUrl('https://www.youtube.com/channel/UCknLrEdhRCp1aegoMqRaCZg'),
    ).toBeNull();
    expect(toEmbedUrl('https://www.youtube.com/@SomeChannel')).toBeNull();
    expect(
      toEmbedUrl('https://www.youtube.com/playlist?list=abc123'),
    ).toBeNull();
    expect(toEmbedUrl('https://www.youtube.com/user/NASA')).toBeNull();
    expect(toEmbedUrl('https://www.youtube.com/c/SomeCustomName')).toBeNull();
    expect(toEmbedUrl('https://youtu.be/')).toBeNull();
  });

  it('returns null for vimeo private/unlisted and unsupported URLs', () => {
    expect(toEmbedUrl('https://vimeo.com/123456/privateHash')).toBeNull();
    expect(toEmbedUrl('https://vimeo.com/user123')).toBeNull();
    expect(toEmbedUrl('https://vimeo.com/channels/staffpicks')).toBeNull();
  });

  it('returns null for non-video discussion pages', () => {
    expect(
      toEmbedUrl('https://www.reddit.com/r/gaming/comments/abc123/title/'),
    ).toBeNull();
    expect(
      toEmbedUrl(
        'https://www.reddit.com/r/gaming/comments/1t3d8dp/do_nte_will_surpass_wuthering_waves/',
      ),
    ).toBeNull();
    expect(toEmbedUrl('https://example.com/article.html')).toBeNull();
    expect(toEmbedUrl('https://example.com/image.jpg')).toBeNull();
  });

  it('passes through recognized direct video file extensions', () => {
    expect(toEmbedUrl('https://example.com/video.mp4')).toBe(
      'https://example.com/video.mp4',
    );
    expect(toEmbedUrl('https://example.com/clip.webm?token=abc')).toBe(
      'https://example.com/clip.webm?token=abc',
    );
  });

  it('returns null for malformed URLs', () => {
    expect(toEmbedUrl('not a url')).toBeNull();
  });
});
