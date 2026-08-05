import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import {
  getActivePlaylistVideos,
  isVideoInActivePlaylist,
  setActivePlaylist,
  setPlaylists,
} from '@/components/widgets/floating-playlist/composables/playlist.state';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { usePlaylistToggle } from './use-playlist-toggle';

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn(),
  fetchPlaylists: vi.fn(),
  savePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  renamePlaylist: vi.fn(),
}));

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

describe('usePlaylistToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    // Adding is gated on an active playlist existing.
    setPlaylists([
      { name: 'Test', videos: [], conversationId: 'conversation-1' },
    ]);
    setActivePlaylist('Test');
  });

  it('reports videos outside the playlist as not added', () => {
    const { isInPlaylist } = usePlaylistToggle(item);
    expect(isInPlaylist.value).toBe(false);
  });

  it('adds the video to the active playlist', () => {
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    expect(isVideoInActivePlaylist(item.videoUrl)).toBe(true);
    expect(isInPlaylist.value).toBe(true);
  });

  it('removes the video when toggled while added', () => {
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    togglePlaylistVideo();
    expect(isVideoInActivePlaylist(item.videoUrl)).toBe(false);
    expect(isInPlaylist.value).toBe(false);
  });

  it('does not add playlist entries without a videoUrl', () => {
    const { togglePlaylistVideo } = usePlaylistToggle({ videoUrl: '' });
    togglePlaylistVideo();
    expect(getActivePlaylistVideos()).toHaveLength(0);
  });

  it('reports a null item as not added and toggles nothing', () => {
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(null);
    expect(isInPlaylist.value).toBe(false);
    togglePlaylistVideo();
    expect(getActivePlaylistVideos()).toHaveLength(0);
  });

  it('follows a reactive item that becomes available later', () => {
    const video = ref<VideoGalleryItem | null>(null);
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(video);
    expect(isInPlaylist.value).toBe(false);
    video.value = item;
    togglePlaylistVideo();
    expect(isInPlaylist.value).toBe(true);
  });

  it('does not add a video when no active playlist exists', () => {
    setPlaylists([]);
    setActivePlaylist('');
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    expect(getActivePlaylistVideos()).toHaveLength(0);
    expect(isInPlaylist.value).toBe(false);
  });
});
