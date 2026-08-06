import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { fetchAllPlaylists } from '@/api/playlists.api';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  activePlaylistName,
  getActivePlaylistVideos,
  getPlaylists,
  playlists,
} from './playlist.state';
import { usePlaylistLibrary } from './use-playlist-library';

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn(),
  fetchPlaylists: vi.fn(),
  savePlaylist: vi.fn().mockResolvedValue(undefined),
  deletePlaylist: vi.fn().mockResolvedValue(undefined),
  renamePlaylist: vi.fn().mockResolvedValue(undefined),
}));

const item: VideoGalleryItem = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

const otherItem: VideoGalleryItem = {
  videoUrl: 'https://youtu.be/other',
  title: 'Other video',
};

describe('usePlaylistLibrary', () => {
  const conversationId = ref('conversation-1');

  beforeEach(() => {
    localStorage.clear();
    playlists.value = [];
    activePlaylistName.value = '';
    conversationId.value = 'conversation-1';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([]);
  });

  it('loads all playlists for the session from the database', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
    ]);
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    expect(library.playlistNames.value).toEqual(['Focus']);
    expect(library.activePlaylistName.value).toBe('Focus');
  });

  it('creates a playlist and makes it active', async () => {
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    expect(getPlaylists().map((p) => p.name)).toEqual(['Focus']);
    expect(library.activePlaylistName.value).toBe('Focus');
    expect(library.playlistNameInput.value).toBe('');
  });

  it('does not create an empty-named playlist', async () => {
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    library.createPlaylist();
    expect(getPlaylists()).toHaveLength(0);
  });

  it('deletes a playlist and clears the active mark', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
    ]);
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    library.deletePlaylist('Focus');
    expect(getPlaylists()).toHaveLength(0);
    expect(library.activePlaylistName.value).toBe('');
  });

  it('renames a playlist', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
    ]);
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    library.renamePlaylist('Focus', 'Chill');
    expect(getPlaylists()[0].name).toBe('Chill');
    expect(library.activePlaylistName.value).toBe('Chill');
  });

  it('rejects a rename to a taken name', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
      { name: 'Chill', conversationId: 'conversation-1', videos: [otherItem] },
    ]);
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    library.renamePlaylist('Focus', 'Chill');
    expect(getPlaylists()[0].name).toBe('Focus');
  });

  it('selecting a playlist makes it active and loads its videos', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
      { name: 'Chill', conversationId: 'conversation-1', videos: [otherItem] },
    ]);
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    library.selectPlaylist('Chill');
    expect(library.activePlaylistName.value).toBe('Chill');
    expect(getActivePlaylistVideos()).toEqual([otherItem]);
  });

  it('exposes the playlist names for the dropdown', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
      { name: 'Chill', conversationId: 'conversation-1', videos: [otherItem] },
    ]);
    const library = usePlaylistLibrary(conversationId);
    await nextTick();
    expect(library.playlistNames.value).toEqual(['Focus', 'Chill']);
  });
});
