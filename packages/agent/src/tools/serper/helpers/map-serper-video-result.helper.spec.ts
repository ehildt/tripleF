import { describe, expect, it } from 'vitest';

import { mapSerperVideoResult } from './map-serper-video-result.helper.js';

describe('mapSerperVideoResult', () => {
  it('maps a video item to the video-search result shape', () => {
    expect(
      mapSerperVideoResult({
        r: {
          title: 'Video',
          link: 'https://www.youtube.com/watch?v=abc123def45',
          snippet: 'Description',
          channel: 'Channel',
          duration: '10:00',
          date: '2025-01-01',
          imageUrl: 'https://proxy.example.com/img.jpg',
          source: 'YouTube',
          views: 100,
        },
        link: 'https://www.youtube.com/watch?v=abc123def45',
      }),
    ).toEqual({
      title: 'Video',
      link: 'https://www.youtube.com/watch?v=abc123def45',
      snippet: 'Description',
      channel: 'Channel',
      duration: '10:00',
      date: '2025-01-01',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
      source: 'YouTube',
      views: 100,
    });
  });

  it('keeps the original link when it was repaired', () => {
    expect(
      mapSerperVideoResult({
        r: {
          title: 'Video',
          link: 'https://www.youtube.com/watch?v=broken',
          snippet: '',
          channel: '',
          duration: '',
          date: '',
          imageUrl: '',
          views: 0,
        },
        link: 'https://www.youtube.com/watch?v=abc123def45',
      }),
    ).toMatchObject({
      link: 'https://www.youtube.com/watch?v=abc123def45',
      originalLink: 'https://www.youtube.com/watch?v=broken',
    });
  });
});
