import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { createPlaybackSession } from '@/composables/use-playback-session';
import { usePlaylistStore } from '@/stores/playlist';

import { usePlaylistMarquee } from './use-playlist-marquee';

describe('usePlaylistMarquee', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  function seedPlaylist() {
    const playlistStore = usePlaylistStore();
    playlistStore.playlists = [
      { name: 'main', videos: [{ videoUrl: 'https://video.test/one' }] },
    ];
    playlistStore.activePlaylistName = 'main';
  }

  it('is false when neither playlist surface is visible', () => {
    const playback = createPlaybackSession();
    const { playlistMarqueeVisible } = usePlaylistMarquee(playback);
    expect(playlistMarqueeVisible.value).toBe(false);
  });

  it('is false in docked mode when no video is playing', () => {
    seedPlaylist();
    const playback = createPlaybackSession();
    playback.dockedPlaylistPanelVisible.value = true;

    const { playlistMarqueeVisible } = usePlaylistMarquee(playback);
    expect(playlistMarqueeVisible.value).toBe(false);
  });

  it('is false when the playing video is not in the active playlist', () => {
    seedPlaylist();
    const playback = createPlaybackSession();
    playback.dockedPlaylistPanelVisible.value = true;
    playback.activePlaybackVideoUrl.value = 'https://video.test/other';

    const { playlistMarqueeVisible } = usePlaylistMarquee(playback);
    expect(playlistMarqueeVisible.value).toBe(false);
  });

  it('is true when the docked panel is visible and the video is in the playlist', () => {
    seedPlaylist();
    const playback = createPlaybackSession();
    playback.dockedPlaylistPanelVisible.value = true;
    playback.activePlaybackVideoUrl.value = 'https://video.test/one';

    const { playlistMarqueeVisible } = usePlaylistMarquee(playback);
    expect(playlistMarqueeVisible.value).toBe(true);
  });

  it('is true in floating mode while the floating playlist is open', () => {
    seedPlaylist();
    const playlistStore = usePlaylistStore();
    playlistStore.playlistMode = 'floating';
    playlistStore.floatingPlaylistOpen = true;

    const playback = createPlaybackSession();
    playback.activePlaybackVideoUrl.value = 'https://video.test/one';

    const { playlistMarqueeVisible } = usePlaylistMarquee(playback);
    expect(playlistMarqueeVisible.value).toBe(true);
  });

  it('is false in floating mode while the floating playlist is closed', () => {
    seedPlaylist();
    const playlistStore = usePlaylistStore();
    playlistStore.playlistMode = 'floating';
    playlistStore.floatingPlaylistOpen = false;

    const playback = createPlaybackSession();
    playback.activePlaybackVideoUrl.value = 'https://video.test/one';

    const { playlistMarqueeVisible } = usePlaylistMarquee(playback);
    expect(playlistMarqueeVisible.value).toBe(false);
  });
});
