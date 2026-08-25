import { describe, expect, it } from 'vitest';

import { parseYouTubeId } from './parse-youtube-id.helper';

describe('parseYouTubeId', () => {
  it('parses watch, share, shorts, and embed forms', () => {
    expect(
      parseYouTubeId(new URL('https://www.youtube.com/watch?v=abc123def45')),
    ).toBe('abc123def45');
    expect(parseYouTubeId(new URL('https://youtu.be/abc123def45'))).toBe(
      'abc123def45',
    );
    expect(
      parseYouTubeId(new URL('https://www.youtube.com/shorts/abc123def45')),
    ).toBe('abc123def45');
    expect(
      parseYouTubeId(new URL('https://www.youtube.com/embed/abc123def45')),
    ).toBe('abc123def45');
  });

  it('salvages the intact id prefix from contaminated watch urls', () => {
    // Real payload shape observed from google.serper.dev/videos: the result
    // title's HTML is glued onto the link after the intact video ID.
    expect(
      parseYouTubeId(
        new URL(
          'https://www.youtube.com/watch?v=R8htow_6tRc:J<b>Title</b> - YouTubeB\uFFFD',
        ),
      ),
    ).toBe('R8htow_6tRc');
  });

  it('salvages the intact id prefix from contaminated shorts urls', () => {
    expect(
      parseYouTubeId(
        new URL('https://www.youtube.com/shorts/647lXug4NWw:@glued<b>on</b>'),
      ),
    ).toBe('647lXug4NWw');
  });

  it('returns null for ids that are not exactly 11 characters', () => {
    expect(
      parseYouTubeId(new URL('https://www.youtube.com/watch?v=v0')),
    ).toBeNull();
    expect(
      parseYouTubeId(
        new URL(
          'https://www.youtube.com/watch?v=this-id-is-way-too-long-for-youtube',
        ),
      ),
    ).toBeNull();
  });

  it('returns null for channel and playlist urls', () => {
    expect(
      parseYouTubeId(new URL('https://www.youtube.com/channel/UCxyz')),
    ).toBeNull();
    expect(
      parseYouTubeId(
        new URL('https://www.youtube.com/playlist?list=PLabc123def45'),
      ),
    ).toBeNull();
    expect(
      parseYouTubeId(new URL('https://www.youtube.com/@channel')),
    ).toBeNull();
  });
});
