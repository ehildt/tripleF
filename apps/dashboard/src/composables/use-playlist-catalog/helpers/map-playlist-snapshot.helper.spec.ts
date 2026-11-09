import { describe, expect, it } from 'vitest';

import { mapPlaylistSnapshot } from './map-playlist-snapshot.helper';

describe('mapPlaylistSnapshot', () => {
  it('projects a playlist snapshot into typed playlist data', () => {
    expect(
      mapPlaylistSnapshot({
        name: 'My list',
        videos: [{ videoUrl: 'https://example.com/v.mp4', title: 'Video' }],
      }),
    ).toEqual({
      name: 'My list',
      videos: [{ videoUrl: 'https://example.com/v.mp4', title: 'Video' }],
    });
  });

  it('omits malformed video entries and defaults malformed queues to empty', () => {
    expect(
      mapPlaylistSnapshot({
        name: 'My list',
        videos: [
          { title: 'Missing URL' },
          null,
          { videoUrl: 'https://example.com/valid', views: 'many' },
          { videoUrl: 'https://example.com/valid', views: 10 },
        ],
      }).videos,
    ).toEqual([{ videoUrl: 'https://example.com/valid', views: 10 }]);

    expect(
      mapPlaylistSnapshot({ name: 'Malformed', videos: null }).videos,
    ).toEqual([]);
  });
});
