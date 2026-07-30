import { describe, expect, it } from 'vitest';

import { videoUrlKeys } from './video-url-keys.helper';

describe('videoUrlKeys', () => {
  it('collapses YouTube watch/shorts/embed/youtu.be variants onto one key', () => {
    const variants = [
      'https://www.youtube.com/watch?v=abc123',
      'https://youtube.com/shorts/abc123',
      'https://www.youtube.com/embed/abc123',
      'https://youtu.be/abc123',
    ];

    const keySets = variants.map(videoUrlKeys);

    for (const keys of keySets) {
      expect(keys).toContain('youtube:abc123');
    }
  });

  it('normalizes protocol, www, case, and trailing slashes', () => {
    expect(videoUrlKeys('HTTPS://WWW.Vimeo.com/123/')).toEqual([
      'vimeo.com/123',
      'vimeo:123',
    ]);
  });

  it('collapses Vimeo page and player-domain variants onto one key', () => {
    const variants = [
      'https://vimeo.com/123456',
      'https://player.vimeo.com/video/123456',
    ];

    for (const url of variants) {
      expect(videoUrlKeys(url)).toContain('vimeo:123456');
    }
  });

  it('collapses Dailymotion page and dai.ly variants onto one key', () => {
    const variants = [
      'https://www.dailymotion.com/video/x8abc12',
      'https://dai.ly/x8abc12',
    ];

    for (const url of variants) {
      expect(videoUrlKeys(url)).toContain('dailymotion:x8abc12');
    }
  });

  it('keeps distinct videos distinct', () => {
    const a = videoUrlKeys('https://www.youtube.com/watch?v=aaa');
    const b = videoUrlKeys('https://www.youtube.com/watch?v=bbb');

    expect(a).not.toContain('youtube:bbb');
    expect(b).not.toContain('youtube:aaa');
  });

  it('returns only the normalized URL for non-YouTube links', () => {
    expect(videoUrlKeys('https://example.com/clip.mp4')).toEqual([
      'example.com/clip.mp4',
    ]);
  });

  it('handles unparseable URLs without throwing', () => {
    expect(videoUrlKeys('not a url')).toEqual(['not a url']);
  });
});
