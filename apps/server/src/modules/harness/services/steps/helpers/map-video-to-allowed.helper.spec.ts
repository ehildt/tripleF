import { describe, expect, it } from 'vitest';

import { mapVideoToAllowed } from './map-video-to-allowed.helper.js';

describe('mapVideoToAllowed', () => {
  it('projects an available video into the allow-list shape', () => {
    expect(
      mapVideoToAllowed({ url: 'https://example.com/v.mp4', title: 'V' }),
    ).toEqual({ videoUrl: 'https://example.com/v.mp4', title: 'V' });
  });
});
