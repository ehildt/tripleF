import { describe, expect, it } from 'vitest';

import { mapVideoToAvailable } from './map-video-to-available.helper.js';

describe('mapVideoToAvailable', () => {
  it('projects a verified video into the available-media shape', () => {
    expect(
      mapVideoToAvailable({
        videoUrl: 'https://example.com/v.mp4',
        title: 'V',
      }),
    ).toEqual({ url: 'https://example.com/v.mp4', title: 'V' });
  });
});
