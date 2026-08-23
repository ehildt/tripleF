import { describe, expect, it } from 'vitest';

import { canonicalVideoId } from './canonical-video-id.helper.js';

/**
 * Canonical-identity fixtures. The dangerous failure is a FALSE MERGE (two
 * distinct videos collapse to one key) or a SPLIT IDENTITY (one video under
 * two keys from a host alias or a dirty ID) — both silently turn into
 * duplicate cards. Keep these invariants true whenever the matchers change.
 */
describe('canonicalVideoId', () => {
  const ID = 'dQw4w9WgXcQ';

  it('collapses every YouTube URL shape for one video onto one identity', () => {
    const variants = [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://mobile.youtube.com/watch?v=${ID}`,
      `https://music.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/live/${ID}`,
      `https://youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube.com/watch?v=${ID}&list=PLabc123`,
      `https://www.youtube.com/watch?v=${ID}&feature=share`,
      `https://www.youtube.com/watch?v=${ID}&t=43`,
    ];

    for (const url of variants) {
      expect(canonicalVideoId(url)).toBe(`youtube:${ID}`);
    }
  });

  it('keeps distinct YouTube videos distinct (no false merge)', () => {
    expect(
      canonicalVideoId('https://www.youtube.com/watch?v=aaaaaaaaaaa'),
    ).toBe('youtube:aaaaaaaaaaa');
    expect(canonicalVideoId('https://youtu.be/bbbbbbbbbbb')).toBe(
      'youtube:bbbbbbbbbbb',
    );
  });

  it('rejects malformed/truncated YouTube IDs instead of splitting an identity', () => {
    for (const url of [
      'https://youtu.be/dQw4w9WgXcQx', // 12 chars
      'https://youtu.be/dQw4w9WgXcQ_trailing', // trailing garbage
      'https://www.youtube.com/watch?v=dQw4w9WgXcQx',
      'https://www.youtube.com/watch?v=', // empty id
      'https://www.youtube.com/shorts/ab', // too short
    ]) {
      expect(canonicalVideoId(url)).toBeNull();
    }
  });

  it('collapses Vimeo page and player-domain variants onto one identity', () => {
    expect(canonicalVideoId('https://vimeo.com/123456')).toBe('vimeo:123456');
    expect(canonicalVideoId('https://player.vimeo.com/video/123456')).toBe(
      'vimeo:123456',
    );
  });

  it('collapses Dailymotion page and dai.ly variants onto one identity', () => {
    expect(canonicalVideoId('https://www.dailymotion.com/video/x8abc12')).toBe(
      'dailymotion:x8abc12',
    );
    expect(canonicalVideoId('https://dai.ly/x8abc12')).toBe(
      'dailymotion:x8abc12',
    );
  });

  it('fails safe on unsupported or unparseable URLs', () => {
    expect(canonicalVideoId('https://example.com/clip.mp4')).toBeNull();
    expect(canonicalVideoId('not a url')).toBeNull();
    expect(canonicalVideoId('')).toBeNull();
  });
});
