import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  popoutHideOnPlaylist,
  setPopoutHideOnPlaylist,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import {
  activePlaybackControlSupported,
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  launchVideo,
  playlistAutoplayEnabled,
  removePlaylistVideo,
  stopActivePlayback,
  toggleActivePlayback,
  togglePlaylistAutoplay,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';

/**
 * Transport-bar state for the playlist tab: whether anything is playing,
 * whether the provider supports controls, and the play/stop/autoplay
 * actions — plus the per-item launch/remove actions bound to the current
 * conversation.
 */
export function usePlaylistTransport(props: {
  playlistVideos: VideoGalleryItem[];
  conversation: Conversation | null;
}) {
  const hasActivePlayback = computed(() =>
    Boolean(activePlaybackVideoUrl.value),
  );

  /** Title of the currently playing track, resolved from the playlist. */
  const activePlaybackTitle = computed(
    () =>
      props.playlistVideos.find(
        (video) => video.videoUrl === activePlaybackVideoUrl.value,
      )?.title ?? '',
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
      videos: props.playlistVideos,
      conversationId: props.conversation?.id ?? '',
    });
  }

  function onRemoveItem(videoUrl: string) {
    removePlaylistVideo(props.conversation?.id ?? '', videoUrl);
  }

  function toggleHideOnPlaylist() {
    setPopoutHideOnPlaylist(!popoutHideOnPlaylist.value);
  }

  return {
    activePlaybackPlaying,
    activePlaybackVideoUrl,
    activePlaybackTitle,
    playlistAutoplayEnabled,
    popoutHideOnPlaylist,
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
