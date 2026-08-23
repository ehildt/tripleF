import { describe, expect, it } from 'vitest';

import { videoUrlKeys } from './video-url-keys.helper';

describe('videoUrlKeys', () => {
  it('collapses YouTube watch/shorts/embed/youtu.be/music/consent variants onto one key', () => {
    const variants = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    ];

    const keySets = variants.map(videoUrlKeys);

    for (const keys of keySets) {
      expect(keys).toContain('youtube:dQw4w9WgXcQ');
    }
  });

  it('rejects malformed/truncated YouTube IDs instead of fabricating an identity', () => {
    // 12 chars and a trailing-garbage segment are not valid YouTube IDs; they
    // must not produce a `youtube:` key (a bad identity silently splits one
    // video into two keys).
    for (const url of [
      'https://youtu.be/dQw4w9WgXcQx',
      'https://youtu.be/dQw4w9WgXcQ_trailing',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQx',
      'https://www.youtube.com/watch?v=',
    ]) {
      expect(videoUrlKeys(url)).not.toContain('youtube:dQw4w9WgXcQx');
      expect(videoUrlKeys(url)).not.toContain('youtube:');
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
    const a = videoUrlKeys('https://www.youtube.com/watch?v=aaaaaaaaaaa');
    const b = videoUrlKeys('https://www.youtube.com/watch?v=bbbbbbbbbbb');

    expect(a).not.toContain('youtube:bbbbbbbbbbb');
    expect(b).not.toContain('youtube:aaaaaaaaaaa');
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
