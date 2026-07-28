import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { usePlaylistToggle } from './use-playlist-toggle';
import { isPlaylistVideo, removePlaylistVideo } from './video-playback.state';

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

describe('usePlaylistToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    removePlaylistVideo('conversation-1', item.videoUrl);
    setActivePinia(createPinia());
  });

  it('reports videos outside the playlist as not added', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist } = usePlaylistToggle(item);
    expect(isInPlaylist.value).toBe(false);
  });

  it('adds the video to the active conversation playlist', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    expect(isPlaylistVideo('conversation-1', item.videoUrl)).toBe(true);
    expect(isInPlaylist.value).toBe(true);
  });

  it('removes the video when toggled while added', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    togglePlaylistVideo();
    expect(isPlaylistVideo('conversation-1', item.videoUrl)).toBe(false);
    expect(isInPlaylist.value).toBe(false);
  });

  it('does nothing without an active conversation', () => {
    const { togglePlaylistVideo } = usePlaylistToggle(item);
    togglePlaylistVideo();
    expect(isPlaylistVideo('', item.videoUrl)).toBe(false);
  });

  it('does not add playlist entries without a videoUrl', () => {
    const store = useConversationStore();
    store.activeConversationId = 'conversation-1';
    const { togglePlaylistVideo } = usePlaylistToggle({ videoUrl: '' });
    togglePlaylistVideo();
    expect(isPlaylistVideo('conversation-1', '')).toBe(false);
  });
});
