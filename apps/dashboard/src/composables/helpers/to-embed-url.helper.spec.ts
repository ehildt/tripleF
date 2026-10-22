import { describe, expect, it } from 'vitest';

const YT = 'dQw4w9WgXcQ';

import { toEmbedUrl } from './to-embed-url.helper';

describe('toEmbedUrl', () => {
  it('rejects empty and malformed input', () => {
    expect(toEmbedUrl('')).toBeNull();
    expect(toEmbedUrl('not a url')).toBeNull();
  });

  it('builds a YouTube embed URL', () => {
    expect(toEmbedUrl(`https://www.youtube.com/watch?v=${YT}`)).toBe(
      `https://www.youtube.com/embed/${YT}`,
    );
    expect(toEmbedUrl(`https://youtu.be/${YT}`)).toBe(
      `https://www.youtube.com/embed/${YT}`,
    );
  });

  it('builds a Vimeo player URL; passes /video/ URLs through', () => {
    expect(toEmbedUrl('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    );
    expect(toEmbedUrl('https://player.vimeo.com/video/123456789?h=1')).toBe(
      'https://player.vimeo.com/video/123456789?h=1',
    );
  });

  it('builds a Dailymotion embed URL', () => {
    expect(toEmbedUrl('https://www.dailymotion.com/video/x7xyz12')).toBe(
      'https://www.dailymotion.com/embed/video/x7xyz12',
    );
    expect(toEmbedUrl('https://dai.ly/x7xyz12')).toBe(
      'https://www.dailymotion.com/embed/video/x7xyz12',
    );
  });

  it('builds a Loom embed URL from a 32-char share id', () => {
    const id = 'a'.repeat(32);
    expect(toEmbedUrl(`https://loom.com/share/${id}`)).toBe(
      `https://www.loom.com/embed/${id}`,
    );
  });

  it('builds a Wistia iframe URL for media and direct paths', () => {
    expect(toEmbedUrl('https://www.wistia.com/medias/abc123')).toBe(
      'https://fast.wistia.net/embed/iframe/abc123',
    );
    expect(toEmbedUrl('https://fast.wistia.net/embed/iframe/abc123')).toBe(
      'https://fast.wistia.net/embed/iframe/abc123',
    );
  });

  it('passes through direct video files unchanged', () => {
    expect(toEmbedUrl('https://cdn.example.com/clip.mp4')).toBe(
      'https://cdn.example.com/clip.mp4',
    );
  });

  it('rejects unsupported platforms and non-http protocols', () => {
    expect(toEmbedUrl('https://www.tiktok.com/@x/video/1')).toBeNull();
    expect(toEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(toEmbedUrl('data:video/mp4;x')).toBeNull();
  });
});
