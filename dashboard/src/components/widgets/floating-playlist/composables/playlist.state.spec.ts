import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAllPlaylists, savePlaylist } from '@/api/playlists.api';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  activePlaylistName,
  addVideoToActivePlaylist,
  createPlaylist,
  getActivePlaylistVideos,
  getPlaylists,
  loadPlaylists,
  playlists,
} from './playlist.state';

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn(),
  savePlaylist: vi.fn(),
  renamePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
}));

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('@/composables/use-toast', () => ({
  useToast: () => ({ error: toastError }),
}));

const item: VideoGalleryItem = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

describe('playlist.state', () => {
  beforeEach(() => {
    localStorage.clear();
    playlists.value = [];
    activePlaylistName.value = '';
    toastError.mockClear();
    vi.mocked(savePlaylist).mockResolvedValue(undefined);
  });

  it('discards a stale load that started before a local mutation', async () => {
    // The fetch resolves late, after the user has already added a playlist.
    vi.mocked(fetchAllPlaylists).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve([{ name: 'Stale', conversationId: 'c', videos: [] }]),
            20,
          ),
        ),
    );

    const pendingLoad = loadPlaylists();
    createPlaylist('conversation-1', 'Fresh');

    await pendingLoad;

    // The in-flight fetch must not clobber the newer in-memory playlist.
    expect(getPlaylists().map((p) => p.name)).toEqual(['Fresh']);
  });

  it('surfaces a toast when saving a playlist fails', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([]);
    await loadPlaylists();

    createPlaylist('conversation-1', 'Focus');
    vi.mocked(savePlaylist).mockRejectedValue(new Error('boom'));

    addVideoToActivePlaylist(item);

    // Let the rejected promise settle and the catch run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getActivePlaylistVideos()[0].videoUrl).toBe(item.videoUrl);
    expect(toastError).toHaveBeenCalledWith('Could not save playlist "Focus"');
  });

  it('adds a video to the active playlist optimistically', () => {
    createPlaylist('conversation-1', 'Focus');
    addVideoToActivePlaylist(item);

    expect(getActivePlaylistVideos()).toEqual([item]);
    expect(savePlaylist).toHaveBeenCalledWith(
      expect.any(String),
      'conversation-1',
      'Focus',
      [item],
    );
  });
});
