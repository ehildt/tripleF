import { describe, expect, it } from 'vitest';

import { mapYoutubeVideoResult } from './map-youtube-video-result.helper.js';

describe('mapYoutubeVideoResult', () => {
  it('maps a search item to the video-search result shape', () => {
    const stats = new Map([['vid1', { viewCount: 100, duration: 'PT1M30S', lang: 'en' }]]);
    expect(
      mapYoutubeVideoResult(
        {
          id: { videoId: 'vid1' },
          snippet: {
            title: 'Video',
            description: 'Description',
            channelTitle: 'Channel',
            publishedAt: '2025-01-01T00:00:00Z',
            thumbnails: { high: { url: 'https://img.example.com/high.jpg' } },
          },
        },
        stats,
      ),
    ).toEqual({
      title: 'Video',
      link: 'https://www.youtube.com/watch?v=vid1',
      snippet: 'Description',
      channel: 'Channel',
      duration: '1:30',
      date: '2025-01-01T00:00:00Z',
      thumbnailUrl: 'https://img.example.com/high.jpg',
      source: 'youtube',
      views: 100,
      lang: 'en',
    });
  });

  it('falls back to empty strings and zero views', () => {
    expect(mapYoutubeVideoResult({ id: { videoId: 'vid1' } }, new Map())).toEqual({
      title: '',
      link: 'https://www.youtube.com/watch?v=vid1',
      snippet: '',
      channel: '',
      duration: '',
      date: '',
      thumbnailUrl: '',
      source: 'youtube',
      views: 0,
      lang: undefined,
    });
  });
});
