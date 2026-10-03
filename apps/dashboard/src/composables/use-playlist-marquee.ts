import { computed } from 'vue';

import { usePlaylistStore } from '@/stores/playlist';

import type { PlaybackSession } from './use-playback-session';

/**
 * App-level "one marquee at a time" coordination: true when the playlist
 * surface (docked panel or floating window) is currently showing the
 * now-playing marquee, so the floating player can suppress its own title
 * marquee. The playback session is the single source of truth; the raw
 * docked-panel visibility and now-playing URL come in as its fields.
 */
export function usePlaylistMarquee(playback: PlaybackSession) {
  const playlistStore = usePlaylistStore();

  const playlistMarqueeVisible = computed(() => {
    if (!playback.dockedPlaylistPanelVisible.value) {
      if (
        playlistStore.playlistMode !== 'floating' ||
        !playlistStore.floatingPlaylistOpen
      ) {
        return false;
      }
    }
    const url = playback.activePlaybackVideoUrl.value;
    if (!url) return false;
    return playlistStore.isVideoInActivePlaylist(url);
  });

  return {
    playlistMarqueeVisible,
  };
}
