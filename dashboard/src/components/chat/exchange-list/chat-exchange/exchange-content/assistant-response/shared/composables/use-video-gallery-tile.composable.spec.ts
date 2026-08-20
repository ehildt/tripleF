import { describe, expect, it } from 'vitest';

import { runInSetup } from '@/test-utils/run-in-setup';

import { useVideoGalleryTile } from './use-video-gallery-tile.composable';

describe('useVideoGalleryTile', () => {
  it('prefers the provided thumbnail over the derived poster URL', () => {
    const { posterUrl } = runInSetup(() =>
      useVideoGalleryTile(() => ({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      })),
    );

    expect(posterUrl.value).toBe('https://example.com/thumb.jpg');
  });

  it('derives the poster URL from the video URL when no thumbnail exists', () => {
    const { posterUrl } = runInSetup(() =>
      useVideoGalleryTile(() => ({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      })),
    );

    expect(posterUrl.value).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
  });

  it('exposes the playlist toggle bound to the item', () => {
    const { isInPlaylist, togglePlaylistVideo } = runInSetup(() =>
      useVideoGalleryTile(() => ({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      })),
    );

    expect(isInPlaylist.value).toBe(false);
    expect(typeof togglePlaylistVideo).toBe('function');
  });
});
