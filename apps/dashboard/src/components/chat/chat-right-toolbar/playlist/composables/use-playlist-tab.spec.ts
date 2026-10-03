import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { usePlaylistStore } from '@/stores/playlist';

import { usePlaylistTab } from './use-playlist-tab';

/** Drives the mocked `usePlaybackSession` return values per test. */
const playback = vi.hoisted(() => ({})) as {
  launchedFromPlaylist: Ref<boolean>;
  launchedVideo: Ref<{ videoUrl: string } | null>;
};

vi.mock('@/composables/use-playback-session', async () => {
  const { ref } = await import('vue');
  const launchedFromPlaylist = ref(false);
  const launchedVideo = ref<{ videoUrl: string } | null>(null);
  playback.launchedFromPlaylist = launchedFromPlaylist;
  playback.launchedVideo = launchedVideo;
  return {
    usePlaybackSession: () => ({ launchedFromPlaylist, launchedVideo }),
  };
});

describe('usePlaylistTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    playback.launchedFromPlaylist.value = false;
    playback.launchedVideo.value = null;
  });

  function seedConversationWithVideo() {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversation.exchanges = [
      {
        id: 'e1',
        role: 'assistant' as const,
        content: '',
        status: 'done' as const,
        timestamp: 0,
        harnessData: {
          videoGalleryItems: [{ videoUrl: 'https://video.test/one' }],
        },
      },
    ];
    return conversation;
  }

  it('is false with no playlist content', () => {
    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(false);
  });

  it('is true when the active playlist has queued videos', () => {
    const playlistStore = usePlaylistStore();
    playlistStore.playlists = [
      { name: 'main', videos: [{ videoUrl: 'https://video.test/one' }] },
    ];
    playlistStore.activePlaylistName = 'main';

    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(true);
  });

  it('is true while any playlist exists, even with an empty queue', () => {
    const playlistStore = usePlaylistStore();
    playlistStore.playlists = [{ name: 'main', videos: [] }];
    playlistStore.activePlaylistName = 'main';

    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(true);
  });

  it('is true when a playlist video is launched', () => {
    playback.launchedFromPlaylist.value = true;
    playback.launchedVideo.value = { videoUrl: 'https://video.test/one' };

    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(true);
  });

  it('is true in panel mode when the conversation has videos', () => {
    seedConversationWithVideo();

    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(true);
  });

  it('drops the conversation-video signal in floating mode', () => {
    seedConversationWithVideo();
    const playlistStore = usePlaylistStore();
    playlistStore.playlistMode = 'floating';

    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(false);
  });

  it('keeps the tab while playlists exist even in floating mode', () => {
    const playlistStore = usePlaylistStore();
    playlistStore.playlists = [{ name: 'main', videos: [] }];
    playlistStore.activePlaylistName = 'main';
    playlistStore.playlistMode = 'floating';

    const { hasPlaylist } = usePlaylistTab();

    expect(hasPlaylist.value).toBe(true);
  });
});
