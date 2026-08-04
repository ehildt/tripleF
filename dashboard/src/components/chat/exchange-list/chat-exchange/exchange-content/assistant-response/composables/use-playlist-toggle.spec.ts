import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { usePlaylistToggle } from './use-playlist-toggle';
import {
  FLOATING_PLAYLIST_QUEUE_KEY,
  isPlaylistVideo,
  removePlaylistVideo,
} from './video-playback.state';

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

describe('usePlaylistToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    removePlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl);
    setActivePinia(createPinia());
  });

  it('reports videos outside the playlist as not added', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist } = usePlaylistToggle(item);
    expect(isInPlaylist.value).toBe(false);
  });

  it('adds the video to the shared global playlist', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    expect(isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl)).toBe(
      true,
    );
    expect(isInPlaylist.value).toBe(true);
  });

  it('removes the video when toggled while added', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    togglePlaylistVideo();
    expect(isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl)).toBe(
      false,
    );
    expect(isInPlaylist.value).toBe(false);
  });

  it('toggles the shared global playlist regardless of the active conversation', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    expect(isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl)).toBe(
      true,
    );
    store.activeConversationId = 'another-conversation';
    expect(isInPlaylist.value).toBe(true);
  });

  it('does not add playlist entries without a videoUrl', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { togglePlaylistVideo } = usePlaylistToggle({ videoUrl: '' });
    togglePlaylistVideo();
    expect(isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, '')).toBe(false);
  });

  it('reports a null item as not added and toggles nothing', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(null);
    expect(isInPlaylist.value).toBe(false);
    togglePlaylistVideo();
    expect(isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl)).toBe(
      false,
    );
  });

  it('follows a reactive item that becomes available later', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const video = ref<VideoGalleryItem | null>(null);
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(video);
    expect(isInPlaylist.value).toBe(false);
    video.value = item;
    togglePlaylistVideo();
    expect(isInPlaylist.value).toBe(true);
  });
});
