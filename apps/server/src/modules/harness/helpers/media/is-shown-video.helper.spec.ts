import { describe, expect, it } from 'vitest';

import type { ShownMediaKeys } from '../../services/shown-media.service.types.js';

import { isShownVideo } from './is-shown-video.helper.js';

const keys = (videos: string[] = []): ShownMediaKeys => ({
  images: new Set<string>(),
  videos: new Set(videos),
});

const VIDEO_ID = 'dQw4w9WgXcQ';

describe('isShownVideo', () => {
  it('matches a URL variant through the canonical provider key', () => {
    expect(
      isShownVideo(
        keys([`youtube:${VIDEO_ID}`]),
        `https://youtu.be/${VIDEO_ID}`,
      ),
    ).toBe(true);
  });

  it('matches through the normalized URL key', () => {
    expect(
      isShownVideo(keys(['example.com/clip']), 'https://www.example.com/clip/'),
    ).toBe(true);
  });

  it('returns false for a different video', () => {
    expect(
      isShownVideo(
        keys([`youtube:${VIDEO_ID}`]),
        'https://youtu.be/AAAAAAAAAAA',
      ),
    ).toBe(false);
  });

  it('returns false when nothing has been shown', () => {
    expect(isShownVideo(keys(), `https://youtu.be/${VIDEO_ID}`)).toBe(false);
  });
});
