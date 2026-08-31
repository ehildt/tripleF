import { describe, expect, it } from 'vitest';

import { mapBrightDataVideoResult } from './map-bright-data-video-result.helper.js';

describe('mapBrightDataVideoResult', () => {
  it('maps a video item to the video-search result shape', () => {
    expect(
      mapBrightDataVideoResult({
        title: 'Video',
        link: 'https://www.youtube.com/watch?v=abc123def45',
        description: 'Description',
        duration: '10:00',
      }),
    ).toEqual({
      title: 'Video',
      link: 'https://www.youtube.com/watch?v=abc123def45',
      snippet: 'Description',
      channel: '',
      duration: '10:00',
      date: '',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
      source: 'brightData',
      views: 0,
    });
  });

  it('falls back to empty strings for missing fields', () => {
    expect(mapBrightDataVideoResult({})).toEqual({
      title: '',
      link: '',
      snippet: '',
      channel: '',
      duration: '',
      date: '',
      thumbnailUrl: '',
      source: 'brightData',
      views: 0,
    });
  });
});
