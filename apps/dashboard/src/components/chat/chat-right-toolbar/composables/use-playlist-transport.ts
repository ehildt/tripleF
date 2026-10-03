import { computed } from 'vue';

import { usePlaybackSession } from '@/composables/use-playback-session';
import { usePlaybackAnchorStore } from '@/stores/playback-anchor';
import { usePlaylistStore } from '@/stores/playlist';
import { usePopoutSettingsStore } from '@/stores/popout-settings';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { usePlaylistPanel } from '../playlist/composables/use-playlist-panel';

/**
 * Transport-bar state for a playlist surface — the chat right toolbar tab and
 * the app-level floating playlist: whether anything is playing, whether the
 * provider supports controls, and the play/stop/autoplay actions — plus the
 * per-item launch/remove actions. Reads the playback session and the active
 * playlist queue by import; it never touches a player element.
 */
export function usePlaylistTransport() {
  const playback = usePlaybackSession();
  const { playlistVideos } = usePlaylistPanel();
  const playbackAnchorStore = usePlaybackAnchorStore();
  const popoutSettingsStore = usePopoutSettingsStore();
  const playlistStore = usePlaylistStore();

  const activePlaybackVideoUrl = computed(
    () => playback.activePlaybackVideoUrl.value,
  );
  const activePlaybackPlaying = computed(
    () => playback.activePlaybackPlaying.value,
  );
  const playlistAutoplayEnabled = computed(
    () => playback.playlistAutoplayEnabled.value,
  );

  const hasActivePlayback = computed(() =>
    Boolean(activePlaybackVideoUrl.value),
  );

  /**
   * Title of the currently playing track for the animated "now playing"
   * text: the playlist's own metadata wins, videos playing outside the
   * playlist fall back to the title they announced on engagement.
   */
  const activePlaybackTitle = computed(
    () =>
      playlistVideos.value.find(
        (video) => video.videoUrl === activePlaybackVideoUrl.value,
      )?.title ?? playback.nowPlayingTitle.value,
  );
  const canTogglePlayback = computed(
    () =>
      hasActivePlayback.value && playback.activePlaybackControlSupported.value,
  );
  const playbackToggleTitle = computed(() => {
    if (!hasActivePlayback.value) return 'Nothing is playing';
    if (!playback.activePlaybackControlSupported.value)
      return 'Playback controls unavailable for this provider';
    return activePlaybackPlaying.value ? 'Pause' : 'Play';
  });

  function onPlayItem(item: VideoGalleryItem) {
    playback.launchVideo(item, {
      videos: playlistVideos.value,
    });
  }

  function onRemoveItem(videoUrl: string) {
    playlistStore.removeVideoFromActivePlaylist(videoUrl);
  }

  /**
   * Whether the player window is currently suppressed — by the background
   * setting while playlist videos play, or by the user dismissing the
   * popout with its close. Drives the transport's eye icon: a closed
   * popout flips it to the closed eye.
   */
  const popoutHidden = computed(
    () =>
      (popoutSettingsStore.popoutHideOnPlaylist &&
        playback.launchedFromPlaylist.value) ||
      playbackAnchorStore.playbackDockMode === 'dock-dismissed',
  );

  function toggleHideOnPlaylist() {
    if (popoutHidden.value) {
      // Show the popout again: clear the background setting and revive a
      // dismissed window — either can hide it independently, and the eye
      // icon currently reads closed either way.
      popoutSettingsStore.setPopoutHideOnPlaylist(false);
      if (playbackAnchorStore.playbackDockMode === 'dock-dismissed') {
        playbackAnchorStore.engagePlayback();
      }
      return;
    }
    // Hide a visible popout: playlist launches enter the background mode
    // via the persistent setting; a standalone (figure-launched) window
    // dismisses instead. With nothing launched the eye plain toggles the
    // setting, like it always has.
    if (playback.launchedFromPlaylist.value || !playback.launchedVideo.value) {
      popoutSettingsStore.setPopoutHideOnPlaylist(true);
      return;
    }
    playbackAnchorStore.dismissPlaybackWindow();
  }

  return {
    activePlaybackPlaying,
    activePlaybackVideoUrl,
    activePlaybackTitle,
    playlistAutoplayEnabled,
    popoutHidden,
    toggleHideOnPlaylist,
    hasActivePlayback,
    canTogglePlayback,
    playbackToggleTitle,
    toggleActivePlayback: playback.requestPlaybackToggle,
    stopActivePlayback: playback.stopPlayback,
    togglePlaylistAutoplay: playback.togglePlaylistAutoplay,
    onPlayItem,
    onRemoveItem,
  };
}
