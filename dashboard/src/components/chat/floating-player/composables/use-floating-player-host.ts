import { computed, onUnmounted, watch } from 'vue';

import { popoutHideOnPlaylist } from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import { usePausablePlayer } from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-pausable-player';
import { usePopupGeometry } from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-popup-geometry';
import {
  closeLaunchedVideo,
  floatingPopupOpacity,
  launchedVideo,
  playlistAutoplayEnabled,
  playNextPlaylistVideo,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';

/**
 * State for the standalone floating player host: the video launched from the
 * playlist panel. Unlike the scroll-out float (which repositions the same
 * iframe), the host mounts a fresh player per launch — autoplay where the
 * provider allows it. Player wiring (embed flags, provider APIs, pause
 * handlers) comes from usePausablePlayer, so an inline video engaged
 * elsewhere pauses the launched popup just like any other player.
 */
export function useFloatingPlayerHost() {
  const { popupStyle, startDrag, startResize, setOpacity } = usePopupGeometry();

  const launchedVideoUrl = computed(() => launchedVideo.value?.videoUrl ?? '');
  const { playerSrc, isDirectVideo, isUnembeddable, setPlayerElement } =
    usePausablePlayer(launchedVideoUrl, undefined, onVideoEnded);

  /** Playlist autoplay: an ended video hands over to the next queue entry. */
  function onVideoEnded() {
    if (playlistAutoplayEnabled.value) playNextPlaylistVideo();
  }

  /** Autoplay on launch where the provider allows it. */
  const embedSrc = computed(() => {
    if (!launchedVideo.value || !playerSrc.value) return '';
    if (/youtube(?:-nocookie)?\.com\/embed\//.test(playerSrc.value)) {
      const separator = playerSrc.value.includes('?') ? '&' : '?';
      return `${playerSrc.value}${separator}autoplay=1`;
    }
    return playerSrc.value;
  });

  const opacityPercent = computed(() =>
    Math.round(floatingPopupOpacity.value * 100),
  );

  // Lift the chat column while a launched video is up.
  watch(
    launchedVideo,
    (video) => {
      document.body.classList.toggle('has-floating-video', Boolean(video));
    },
    { immediate: true },
  );

  onUnmounted(() => {
    document.body.classList.remove('has-floating-video');
  });

  return {
    launchedVideo,
    popupStyle,
    popoutHideOnPlaylist,
    embedSrc,
    isDirectVideo,
    isUnembeddable,
    setPlayerElement,
    opacityPercent,
    setOpacity,
    startDrag,
    startResize,
    close: closeLaunchedVideo,
  };
}
