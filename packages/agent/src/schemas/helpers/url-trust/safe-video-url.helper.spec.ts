import { describe, expect, it } from 'vitest';

import { safeVideoUrl } from './safe-video-url.helper.js';

describe('safeVideoUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(safeVideoUrl().safeParse('https://www.youtube.com/watch?v=abc123').success).toBe(true);
    expect(safeVideoUrl().safeParse('http://example.com/video.mp4').success).toBe(true);
  });

  it('rejects non-absolute values', () => {
    expect(safeVideoUrl().safeParse('not-a-url').success).toBe(false);
    expect(safeVideoUrl().safeParse('/api/v1/storage/session/chat/abc').success).toBe(false);
  });

  it('rejects non-http(s) schemes', () => {
    expect(safeVideoUrl().safeParse('javascript:alert(1)').success).toBe(false);
    expect(safeVideoUrl().safeParse('ftp://example.com/video.mp4').success).toBe(false);
  });

  it('uses the default message', () => {
    expect(safeVideoUrl().safeParse('not-a-url').error?.issues[0].message).toBe('must be a safe video URL');
  });

  it('supports a custom message', () => {
    expect(safeVideoUrl('videos must be external').safeParse('not-a-url').error?.issues[0].message).toBe(
      'videos must be external',
    );
  });
});
