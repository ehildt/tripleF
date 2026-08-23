import { describe, expect, it } from 'vitest';

import { isVideoMediaItem } from './is-video-media-item.helper';

describe('isVideoMediaItem', () => {
  it('returns true for a video item', () => {
    expect(isVideoMediaItem({ videoUrl: 'https://youtu.be/x' })).toBe(true);
  });

  it('returns false for an image item', () => {
    expect(isVideoMediaItem({ imageUrl: '/a.jpg' })).toBe(false);
  });
});
