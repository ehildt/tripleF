import { computed, type Ref } from 'vue';

import { removeVideoFromActivePlaylist } from '@/components/widgets/floating-playlist/composables/playlist.state';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  dismissPlaybackWindow,
  engagePlayback,
  playbackDockMode,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/playback-anchor.state';
import {
  popoutHideOnPlaylist,
  setPopoutHideOnPlaylist,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import {
  activePlaybackControlSupported,
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  launchedFromPlaylist,
  launchedVideo,
  launchVideo,
  nowPlayingTitle,
  playlistAutoplayEnabled,
  stopActivePlayback,
  toggleActivePlayback,
  togglePlaylistAutoplay,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';

/**
 * Transport-bar state for a playlist surface — the chat right panel tab and
 * the app-level floating playlist: whether anything is playing, whether the
 * provider supports controls, and the play/stop/autoplay actions — plus the
 * per-item launch/remove actions bound to the owning conversation.
 */
export function usePlaylistTransport(
  playlistVideos: Ref<VideoGalleryItem[]>,
  conversationId: Ref<string>,
) {
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
      )?.title ?? nowPlayingTitle.value,
  );
  const canTogglePlayback = computed(
    () => hasActivePlayback.value && activePlaybackControlSupported.value,
  );
  const playbackToggleTitle = computed(() => {
    if (!hasActivePlayback.value) return 'Nothing is playing';
    if (!activePlaybackControlSupported.value)
      return 'Playback controls unavailable for this provider';
    return activePlaybackPlaying.value ? 'Pause' : 'Play';
  });

  function onPlayItem(item: VideoGalleryItem) {
    launchVideo(item, {
      videos: playlistVideos.value,
      conversationId: conversationId.value,
    });
  }

  function onRemoveItem(videoUrl: string) {
    removeVideoFromActivePlaylist(videoUrl);
  }

  /**
   * Whether the player window is currently suppressed — by the background
   * setting while playlist videos play, or by the user dismissing the
   * popout with its close. Drives the transport's eye icon: a closed
   * popout flips it to the closed eye.
   */
  const popoutHidden = computed(
    () =>
      (popoutHideOnPlaylist.value && launchedFromPlaylist.value) ||
      playbackDockMode.value === 'dock-dismissed',
  );

  function toggleHideOnPlaylist() {
    if (popoutHidden.value) {
      // Show the popout again: clear the background setting and revive a
      // dismissed window — either can hide it independently, and the eye
      // icon currently reads closed either way.
      setPopoutHideOnPlaylist(false);
      if (playbackDockMode.value === 'dock-dismissed') engagePlayback();
      return;
    }
    // Hide a visible popout: playlist launches enter the background mode
    // via the persistent setting; a standalone (figure-launched) window
    // dismisses instead. With nothing launched the eye plain toggles the
    // setting, like it always has.
    if (launchedFromPlaylist.value || !launchedVideo.value) {
      setPopoutHideOnPlaylist(true);
      return;
    }
    dismissPlaybackWindow();
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
    toggleActivePlayback,
    stopActivePlayback,
    togglePlaylistAutoplay,
    onPlayItem,
    onRemoveItem,
  };
}
