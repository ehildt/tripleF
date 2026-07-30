import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, type Ref, ref } from 'vue';

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

async function typeName(input: Ref<string>, name: string) {
  input.value = name;
  await vi.advanceTimersByTimeAsync(600);
  await nextTick();
}

describe('usePlaylistLibrary', () => {
  const conversationId = ref('conversation-1');
  const queue = ref<VideoGalleryItem[]>([item, otherItem]);

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    closeLaunchedVideo();
    savedPlaylists.value = [];
    activeSavedPlaylistId.value = null;
    addedPlaylistVideos.value = new Map();
    conversationId.value = 'conversation-1';
    queue.value = [item, otherItem];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('typing a name saves the queue as a playlist', async () => {
    const library = usePlaylistLibrary(conversationId, queue);
    await typeName(library.playlistNameInput, 'Focus');
    expect(savedPlaylists.value.map((entry) => entry.name)).toEqual(['Focus']);
    expect(activeSavedPlaylistId.value).toBe(savedPlaylists.value[0].id);
  });

  it('further typing renames the active playlist', async () => {
    const library = usePlaylistLibrary(conversationId, queue);
    await typeName(library.playlistNameInput, 'Focus');
    await typeName(library.playlistNameInput, 'Chill');
    expect(savedPlaylists.value).toHaveLength(1);
    expect(savedPlaylists.value[0].name).toBe('Chill');
  });

  it('emptying the input deletes the playlist, the queue stays temporary', async () => {
    const library = usePlaylistLibrary(conversationId, queue);
    await typeName(library.playlistNameInput, 'Focus');
    await typeName(library.playlistNameInput, '');
    expect(savedPlaylists.value).toHaveLength(0);
    expect(activeSavedPlaylistId.value).toBeNull();
    expect(queue.value).toEqual([item, otherItem]);
  });

  it('a rename collision reverts the input and keeps the playlist', async () => {
    savedPlaylists.value = [
      { id: 'p1', name: 'Taken', videos: [item] },
      { id: 'p2', name: 'Focus', videos: [item] },
    ];
    activeSavedPlaylistId.value = 'p2';
    const library = usePlaylistLibrary(conversationId, queue);
    await typeName(library.playlistNameInput, 'Taken');
    expect(savedPlaylists.value[1].name).toBe('Focus');
    // The reverted input settles on the next debounce without further change.
    await vi.advanceTimersByTimeAsync(600);
    expect(library.playlistNameInput.value).toBe('Focus');
  });

  it('does not save an empty queue', async () => {
    queue.value = [];
    const library = usePlaylistLibrary(conversationId, queue);
    await typeName(library.playlistNameInput, 'Focus');
    expect(savedPlaylists.value).toHaveLength(0);
  });

  it('queue edits sync into the active saved playlist', async () => {
    const library = usePlaylistLibrary(conversationId, queue);
    await typeName(library.playlistNameInput, 'Focus');
    queue.value = [otherItem];
    await nextTick();
    expect(savedPlaylists.value[0].videos).toEqual([otherItem]);
  });

  it('picking a playlist autoloads it and marks it active', async () => {
    savedPlaylists.value = [{ id: 'p1', name: 'Focus', videos: [otherItem] }];
    addedPlaylistVideos.value = new Map([['conversation-1', [item]]]);
    const library = usePlaylistLibrary(conversationId, queue);
    library.selectPlaylist('Focus');
    expect(isPlaylistVideo('conversation-1', item.videoUrl)).toBe(false);
    expect(isPlaylistVideo('conversation-1', otherItem.videoUrl)).toBe(true);
    expect(activeSavedPlaylistId.value).toBe('p1');
    expect(library.playlistNameInput.value).toBe('Focus');
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
    await typeName(library.playlistNameInput, 'Focus');
    conversationId.value = 'conversation-2';
    await nextTick();
    expect(activeSavedPlaylistId.value).toBeNull();
    expect(library.playlistNameInput.value).toBe('');
  });

  it('exposes the saved playlist names for the dropdown', async () => {
    savedPlaylists.value = [
      { id: 'p1', name: 'Focus', videos: [item] },
      { id: 'p2', name: 'Chill', videos: [otherItem] },
    ];
    const library = usePlaylistLibrary(conversationId, queue);
    expect(library.savedPlaylistNames.value).toEqual(['Focus', 'Chill']);
  });
});
