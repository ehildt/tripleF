import { describe, expect, it } from 'vitest';

import { mapPlaylistSnapshot } from './map-playlist-snapshot.helper';

describe('mapPlaylistSnapshot', () => {
  it('projects a playlist snapshot into the playlist shape', () => {
    expect(
      mapPlaylistSnapshot({
        name: 'My list',
        videos: [{ videoUrl: 'https://example.com/v.mp4' }],
      }),
    ).toEqual({
      name: 'My list',
      videos: [{ videoUrl: 'https://example.com/v.mp4' }],
    });
  });
});
