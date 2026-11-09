import { computed } from 'vue';

import { useFloatingPlaylistOpen } from '@/components/widgets/floating-playlist/composables/use-floating-playlist-open';
import type { PlaybackSession } from '@/composables/create-playback-session/create-playback-session';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';

import type { PlaylistMarqueeState } from './use-playlist-marquee.types';

/**
 * App-level "one marquee at a time" coordination: true when the playlist
 * surface (docked panel or floating window) is currently showing the
 * now-playing marquee, so the floating player can suppress its own title
 * marquee. The playback session is the single source of truth; the raw
 * docked-panel visibility and now-playing URL come in as its fields.
 */
export function usePlaylistMarquee(
  playback: PlaybackSession,
): PlaylistMarqueeState {
  const playlistStore = usePlaylistStore();
  const playlistSettingsStore = usePlaylistSettingsStore();
  const floatingPlaylist = useFloatingPlaylistOpen();

  const playlistMarqueeVisible = computed(() => {
    if (!playback.dockedPlaylistPanelVisible.value) {
      if (
        playlistSettingsStore.playlistMode !== 'floating' ||
        !floatingPlaylist.floatingPlaylistOpen.value
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
