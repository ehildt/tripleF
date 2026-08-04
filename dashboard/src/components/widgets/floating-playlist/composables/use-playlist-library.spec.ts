import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import {
  addedPlaylistVideos,
  closeLaunchedVideo,
  isPlaylistVideo,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { activeSavedPlaylistId, savedPlaylists } from './saved-playlists.state';
import { usePlaylistLibrary } from './use-playlist-library';

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
  const queue = ref<VideoGalleryItem[]>([item, otherItem]);

  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    savedPlaylists.value = [];
    activeSavedPlaylistId.value = null;
    addedPlaylistVideos.value = new Map();
    conversationId.value = 'conversation-1';
    queue.value = [item, otherItem];
  });

  it('starts unnamed with no active playlist', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    expect(library.playlistNameInput.value).toBe('');
    expect(library.activePlaylistName.value).toBe('');
  });

  it('the Plus button saves the queue as a playlist and clears the field', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    expect(savedPlaylists.value.map((entry) => entry.name)).toEqual(['Focus']);
    expect(activeSavedPlaylistId.value).toBe(savedPlaylists.value[0].id);
    expect(library.playlistNameInput.value).toBe('');
    expect(library.activePlaylistName.value).toBe('Focus');
  });

  it('the Plus button does not save an empty name, but saves an empty queue', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.createPlaylist();
    expect(savedPlaylists.value).toHaveLength(0);

    queue.value = [];
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    expect(savedPlaylists.value).toHaveLength(1);
    expect(savedPlaylists.value[0].videos).toEqual([]);
  });

  it('deletes a saved playlist by name', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    library.playlistNameInput.value = 'Chill';
    library.createPlaylist();
    library.deletePlaylist('Focus');
    expect(savedPlaylists.value.map((entry) => entry.name)).toEqual(['Chill']);
  });

  it('deleting the active playlist clears the active mark', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    library.deletePlaylist('Focus');
    expect(savedPlaylists.value).toHaveLength(0);
    expect(activeSavedPlaylistId.value).toBeNull();
    expect(library.activePlaylistName.value).toBe('');
  });

  it('deleting an unknown name is a no-op', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.deletePlaylist('Unknown');
    expect(savedPlaylists.value).toHaveLength(0);
  });

  it('renames a saved playlist', () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    library.renamePlaylist('Focus', 'Chill');
    expect(savedPlaylists.value).toHaveLength(1);
    expect(savedPlaylists.value[0].name).toBe('Chill');
  });

  it('rename to a taken name is rejected', () => {
    savedPlaylists.value = [
      { id: 'p1', name: 'Focus', videos: [item] },
      { id: 'p2', name: 'Chill', videos: [otherItem] },
    ];
    const library = usePlaylistLibrary(conversationId, queue);
    library.renamePlaylist('Focus', 'Chill');
    expect(savedPlaylists.value[0].name).toBe('Focus');
  });

  it('queue edits sync into the active saved playlist', async () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    queue.value = [otherItem];
    await nextTick();
    expect(savedPlaylists.value[0].videos).toEqual([otherItem]);
  });

  it('picking a playlist autoloads it and marks it active', () => {
    savedPlaylists.value = [{ id: 'p1', name: 'Focus', videos: [otherItem] }];
    addedPlaylistVideos.value = new Map([['conversation-1', [item]]]);
    const library = usePlaylistLibrary(conversationId, queue);
    library.selectPlaylist('Focus');
    expect(isPlaylistVideo('conversation-1', item.videoUrl)).toBe(false);
    expect(isPlaylistVideo('conversation-1', otherItem.videoUrl)).toBe(true);
    expect(activeSavedPlaylistId.value).toBe('p1');
    expect(library.activePlaylistName.value).toBe('Focus');
  });

  it('picking an unknown name is a no-op', () => {
    addedPlaylistVideos.value = new Map([['conversation-1', [item]]]);
    const library = usePlaylistLibrary(conversationId, queue);
    library.selectPlaylist('Unknown');
    expect(addedPlaylistVideos.value.get('conversation-1')).toEqual([item]);
    expect(activeSavedPlaylistId.value).toBeNull();
  });

  it('a conversation switch resets to a temporary queue', async () => {
    const library = usePlaylistLibrary(conversationId, queue);
    library.playlistNameInput.value = 'Focus';
    library.createPlaylist();
    conversationId.value = 'conversation-2';
    await nextTick();
    expect(activeSavedPlaylistId.value).toBeNull();
    expect(library.playlistNameInput.value).toBe('');
    expect(library.activePlaylistName.value).toBe('');
  });

  it('exposes the saved playlist names for the dropdown', () => {
    savedPlaylists.value = [
      { id: 'p1', name: 'Focus', videos: [item] },
      { id: 'p2', name: 'Chill', videos: [otherItem] },
    ];
    const library = usePlaylistLibrary(conversationId, queue);
    expect(library.savedPlaylistNames.value).toEqual(['Focus', 'Chill']);
  });
});
