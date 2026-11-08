import { describe, expect, it } from 'vitest';

import { isVideoUrl } from './is-video-url.helper';

describe('isVideoUrl', () => {
  it('rejects empty input', () => {
    expect(isVideoUrl('')).toBe(false);
  });

  it('accepts direct video file extensions', () => {
    expect(isVideoUrl('https://cdn.example.com/clip.mp4')).toBe(true);
  });

  it('accepts a YouTube watch URL', () => {
    expect(isVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true,
    );
  });

  it('accepts a youtu.be link with a path', () => {
    expect(isVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('rejects a bare youtu.be domain', () => {
    expect(isVideoUrl('https://youtu.be/')).toBe(false);
  });

  it('accepts a youtube-nocookie embed URL', () => {
    expect(
      isVideoUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    ).toBe(true);
  });

  it('accepts Vimeo URLs', () => {
    expect(isVideoUrl('https://vimeo.com/123456789')).toBe(true);
  });

  it('rejects discussion pages from non-embeddable hosts', () => {
    expect(isVideoUrl('https://www.reddit.com/r/videos/comments/x')).toBe(
      false,
    );
  });

  it('rejects non-http protocols', () => {
    expect(isVideoUrl('javascript:alert(1).mp4')).toBe(false);
  });

  it('rejects unparseable input', () => {
    expect(isVideoUrl('not a url')).toBe(false);
  });
});
