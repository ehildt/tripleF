import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { usePlaybackAnchorRegistry } from '@/composables/use-playback-anchor-registry/use-playback-anchor-registry';
import { usePlaybackSession } from '@/composables/use-playback-session/use-playback-session';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import type { PlaylistTransportControls } from './use-playlist-transport.types';

/** Derive playlist transport state and compose launch/popout interactions. */
export function usePlaylistTransport(): PlaylistTransportControls {
  const playback = usePlaybackSession();
  const playbackAnchorStore = usePlaybackAnchorRegistry();
  const popoutSettingsStore = usePopoutSettingsStore();
  const playlistStore = usePlaylistStore();
  const { activePlaylistVideos } = storeToRefs(playlistStore);
  const activePlaybackVideoUrl = playback.activePlaybackVideoUrl;
  const activePlaybackPlaying = playback.activePlaybackPlaying;

  const hasActivePlayback = computed(() =>
    Boolean(activePlaybackVideoUrl.value),
  );

  const activePlaybackTitle = computed(
    () =>
      activePlaylistVideos.value.find(
        (video) => video.videoUrl === activePlaybackVideoUrl.value,
      )?.title ?? playback.nowPlayingTitle.value,
  );
  const canTogglePlayback = computed(
    () =>
      hasActivePlayback.value && playback.activePlaybackControlSupported.value,
  );
  const playbackToggleTitle = computed(() => {
    if (!hasActivePlayback.value) return 'Nothing is playing';
    if (!playback.activePlaybackControlSupported.value) {
      return 'Playback controls unavailable for this provider';
    }
    return activePlaybackPlaying.value ? 'Pause' : 'Play';
  });

  function onPlayItem(item: VideoGalleryItem): void {
    playback.launchVideo(item, { videos: activePlaylistVideos.value });
  }

  const popoutHidden = computed(
    () =>
      (popoutSettingsStore.popoutHideOnPlaylist &&
        playback.launchedFromPlaylist.value) ||
      playbackAnchorStore.playbackDockMode.value === 'dock-dismissed',
  );

  function toggleHideOnPlaylist(): void {
    if (popoutHidden.value) {
      popoutSettingsStore.setPopoutHideOnPlaylist(false);
      if (playbackAnchorStore.playbackDockMode.value === 'dock-dismissed') {
        playbackAnchorStore.engagePlayback();
      }
      return;
    }
    if (playback.launchedFromPlaylist.value || !playback.launchedVideo.value) {
      popoutSettingsStore.setPopoutHideOnPlaylist(true);
      return;
    }
    playbackAnchorStore.dismissPlaybackWindow();
  }

  return {
    activePlaybackTitle,
    popoutHidden,
    toggleHideOnPlaylist,
    hasActivePlayback,
    canTogglePlayback,
    playbackToggleTitle,
    onPlayItem,
  };
}
