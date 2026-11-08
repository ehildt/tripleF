import { describe, expect, it } from 'vitest';

import { buildVideoPosterCandidates } from './build-video-poster-candidates.helper';

describe('buildVideoPosterCandidates', () => {
  it('returns the three YouTube candidates for a watch URL', () => {
    expect(
      buildVideoPosterCandidates('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual([
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    ]);
  });

  it('returns YouTube candidates for a youtu.be share link', () => {
    expect(buildVideoPosterCandidates('https://youtu.be/dQw4w9WgXcQ')[0]).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
  });

  it('returns one Dailymotion candidate for a /video/ URL', () => {
    expect(
      buildVideoPosterCandidates('https://www.dailymotion.com/video/x7xyz12'),
    ).toEqual(['https://www.dailymotion.com/thumbnail/video/x7xyz12']);
  });

  it('returns a Dailymotion candidate for a dai.ly short link', () => {
    expect(buildVideoPosterCandidates('https://dai.ly/x7xyz12')).toEqual([
      'https://www.dailymotion.com/thumbnail/video/x7xyz12',
    ]);
  });

  it('returns an empty list for a non-video URL', () => {
    expect(buildVideoPosterCandidates('https://example.com/page')).toEqual([]);
  });

  it('returns an empty list for an unparseable URL', () => {
    expect(buildVideoPosterCandidates('not a url')).toEqual([]);
  });
});
