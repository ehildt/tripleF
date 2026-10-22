import { describe, expect, it } from 'vitest';

import { parseYouTubeId } from './parse-youtube-id.helper';

const YT = 'dQw4w9WgXcQ';

function url(input: string): URL {
  return new URL(input);
}

describe('parseYouTubeId', () => {
  it('parses a watch v param', () => {
    expect(parseYouTubeId(url(`https://www.youtube.com/watch?v=${YT}`))).toBe(
      YT,
    );
  });

  it('parses a watch vi param', () => {
    expect(parseYouTubeId(url(`https://www.youtube.com/watch?vi=${YT}`))).toBe(
      YT,
    );
  });

  it('parses a youtu.be share path', () => {
    expect(parseYouTubeId(url(`https://youtu.be/${YT}`))).toBe(YT);
  });

  it('parses shorts, embed, live, and legacy player paths', () => {
    for (const path of ['shorts', 'embed', 'live', 'v', 'vi', 'e']) {
      expect(parseYouTubeId(url(`https://www.youtube.com/${path}/${YT}`))).toBe(
        YT,
      );
    }
  });

  it('returns null for channel, user, and playlist URLs', () => {
    expect(parseYouTubeId(url('https://www.youtube.com/@channel'))).toBeNull();
    expect(
      parseYouTubeId(url('https://www.youtube.com/channel/UCx')),
    ).toBeNull();
    expect(
      parseYouTubeId(url('https://www.youtube.com/playlist?list=PLx')),
    ).toBeNull();
  });

  it('salvages an intact 11-char prefix from contaminated payloads', () => {
    expect(
      parseYouTubeId(url(`https://www.youtube.com/watch?v=${YT}:Jx`)),
    ).toBe(YT);
  });

  it('returns null for a malformed id', () => {
    expect(
      parseYouTubeId(url('https://www.youtube.com/watch?v=short')),
    ).toBeNull();
  });
});
