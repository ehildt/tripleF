import { describe, expect, it } from 'vitest';

import {
  buildVideoPosterCandidates,
  buildVideoPosterUrl,
} from './build-video-poster-url.helper';

describe('buildVideoPosterCandidates', () => {
  it('returns the YouTube fallback chain best-quality first', () => {
    expect(
      buildVideoPosterCandidates('https://www.youtube.com/watch?v=abc123def45'),
    ).toEqual([
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
      'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg',
      'https://i.ytimg.com/vi/abc123def45/mqdefault.jpg',
    ]);
  });

  it('handles youtu.be short links', () => {
    expect(buildVideoPosterCandidates('https://youtu.be/xyz789ghi01')[0]).toBe(
      'https://i.ytimg.com/vi/xyz789ghi01/maxresdefault.jpg',
    );
  });

  it('returns a single candidate for Dailymotion', () => {
    expect(
      buildVideoPosterCandidates('https://www.dailymotion.com/video/x8abc'),
    ).toEqual(['https://www.dailymotion.com/thumbnail/video/x8abc']);
  });

  it('returns an empty array for an invalid URL', () => {
    expect(buildVideoPosterCandidates('not a url')).toEqual([]);
  });

  it('returns an empty array for an unsupported host', () => {
    expect(buildVideoPosterCandidates('https://vimeo.com/123')).toEqual([]);
  });
});

describe('buildVideoPosterUrl', () => {
  it('returns the highest-resolution candidate', () => {
    expect(
      buildVideoPosterUrl('https://www.youtube.com/watch?v=abc123def45'),
    ).toBe('https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg');
  });

  it('returns null when no candidate exists', () => {
    expect(buildVideoPosterUrl('https://vimeo.com/123')).toBeNull();
  });
});
