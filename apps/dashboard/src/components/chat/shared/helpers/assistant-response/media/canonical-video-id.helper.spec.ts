import { describe, expect, it } from 'vitest';

import { canonicalVideoId } from './canonical-video-id.helper';

const YT_ID = 'dQw4w9WgXcQ';

describe('canonicalVideoId', () => {
  it('returns a YouTube identity for a watch URL', () => {
    expect(canonicalVideoId(`https://www.youtube.com/watch?v=${YT_ID}`)).toBe(
      `youtube:${YT_ID}`,
    );
  });

  it('collapses youtu.be share links onto the same identity', () => {
    expect(canonicalVideoId(`https://youtu.be/${YT_ID}`)).toBe(
      `youtube:${YT_ID}`,
    );
  });

  it('collapses youtube shorts, embed, and live paths', () => {
    expect(canonicalVideoId(`https://www.youtube.com/shorts/${YT_ID}`)).toBe(
      `youtube:${YT_ID}`,
    );
    expect(canonicalVideoId(`https://www.youtube.com/embed/${YT_ID}`)).toBe(
      `youtube:${YT_ID}`,
    );
  });

  it('normalizes www/m/mobile/music subdomains onto one host', () => {
    expect(canonicalVideoId(`https://m.youtube.com/watch?v=${YT_ID}`)).toBe(
      `youtube:${YT_ID}`,
    );
    expect(canonicalVideoId(`https://music.youtube.com/watch?v=${YT_ID}`)).toBe(
      `youtube:${YT_ID}`,
    );
  });

  it('returns a Vimeo identity for both host shapes', () => {
    expect(canonicalVideoId('https://vimeo.com/123456789')).toBe(
      'vimeo:123456789',
    );
    expect(canonicalVideoId('https://player.vimeo.com/video/123456789')).toBe(
      'vimeo:123456789',
    );
  });

  it('returns a Dailymotion identity for both host shapes', () => {
    expect(canonicalVideoId('https://www.dailymotion.com/video/x7xyz12')).toBe(
      'dailymotion:x7xyz12',
    );
    expect(canonicalVideoId('https://dai.ly/x7xyz12')).toBe(
      'dailymotion:x7xyz12',
    );
  });

  it('rejects a YouTube id that does not match the 11-char shape', () => {
    expect(
      canonicalVideoId('https://www.youtube.com/watch?v=short'),
    ).toBeNull();
  });

  it('returns null for unsupported providers', () => {
    expect(canonicalVideoId('https://vimeo.com/')).toBeNull();
    expect(canonicalVideoId('https://example.com/video')).toBeNull();
  });

  it('returns null for unparseable input', () => {
    expect(canonicalVideoId('not a url')).toBeNull();
  });
});
