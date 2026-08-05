import { computed, onUnmounted, ref, watch } from 'vue';

import {
  dockedAnchorCandidate,
  dockedAnchorElement,
  dockPlayback,
  engagePlayback,
  forceShowPlayer,
  latchFloating,
  playbackDockMode,
  visibleAnchorCandidate,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/playback-anchor.state';
import {
  popoutAutoDock,
  popoutEnabled,
  popoutHideOnPlaylist,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import { usePausablePlayer } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-pausable-player';
import { usePopupGeometry } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-popup-geometry';
import {
  activePlaybackPlaying,
  floatingPopupOpacity,
  launchedFromPlaylist,
  launchedVideo,
  playlistAutoplayEnabled,
  playNextPlaylistVideo,
  stopActivePlayback,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { useConversationStore } from '@/stores/conversation';

/**
 * State for the standalone floating player host — the single mounted player
 * for the whole app. Mounted at app level, it survives tab and conversation
 * switches untouched. The host never moves in the DOM; it only changes its
 * CSS positioning:
 *
 * - docked-inline: a figure for the launched video is in view — the player
 *   overlays the figure's media box exactly (tracked every animation
 *   frame), bare, without popup chrome.
 * - floating: no figure is in view — the player shows as the draggable,
 *   resizable popup with its chrome.
 * - hidden: dock-dismissed off-screen, the playlist background setting, or
 *   popouts disabled without a registered figure — suppressed via
 *   visibility (audio keeps playing; display:none would risk suspending
 *   iframe media).
 *
 * Autoplay where the provider allows it happens per fresh mount (keyed by
 * video URL). Player wiring (embed flags, provider APIs, pause handlers)
 * comes from usePausablePlayer.
 */
export function useFloatingPlayerHost() {
  const { popupStyle, startDrag, startResize, setOpacity } = usePopupGeometry();

  const launchedVideoUrl = computed(() => launchedVideo.value?.videoUrl ?? '');
  const { playerSrc, isDirectVideo, isUnembeddable, setPlayerElement } =
    usePausablePlayer(launchedVideoUrl, undefined, onVideoEnded);

  /** Playlist autoplay: an ended video hands over to the next queue entry. */
  function onVideoEnded() {
    if (playlistAutoplayEnabled.value && launchedFromPlaylist.value)
      playNextPlaylistVideo();
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

  // ---------- docked-inline vs floating vs hidden ----------

  const dockedInline = computed(() => dockedAnchorElement.value !== null);

  /**
   * Popout autodock off: once the anchor is lost, latch into floating mode
   * (mirroring the old float latch). Only latches when a registered figure
   * reports not-in-view — never on launch itself, where registration is
   * optimistic-in-view until the observer's first callback.
   */
  watch(
    [visibleAnchorCandidate, playbackDockMode],
    () => {
      if (
        popoutEnabled.value &&
        !popoutAutoDock.value &&
        playbackDockMode.value === 'auto' &&
        launchedVideo.value &&
        !visibleAnchorCandidate.value
      ) {
        latchFloating();
      }
    },
    { immediate: true },
  );

  // Resuming paused playback re-follows the anchor (old dismissal re-arm).
  watch(activePlaybackPlaying, (playing) => {
    if (playing && playbackDockMode.value === 'dock-dismissed')
      engagePlayback();
  });

  const windowHidden = computed(
    () =>
      !forceShowPlayer.value &&
      (playbackDockMode.value === 'dock-dismissed' ||
        (popoutHideOnPlaylist.value && launchedFromPlaylist.value) ||
        (!popoutEnabled.value &&
          Boolean(launchedVideo.value) &&
          !dockedInline.value)),
  );

  // A conversation switch while a video is playing always shows the player:
  // re-engage auto-following and override the hide-on-playlist background
  // setting so the window stays visible across the switch.
  const conversationStore = useConversationStore();
  watch(
    () => conversationStore.activeConversationId,
    () => {
      if (!launchedVideo.value) return;
      forceShowPlayer.value = true;
      engagePlayback();
    },
  );

  // ---------- inline rect tracking ----------

  const anchorRect = ref<DOMRectReadOnly | null>(null);
  const scrollRootRect = ref<DOMRectReadOnly | null>(null);
  let anchorRectRafId = 0;

  function stopAnchorTracking() {
    if (anchorRectRafId) cancelAnimationFrame(anchorRectRafId);
    anchorRectRafId = 0;
    anchorRect.value = null;
    scrollRootRect.value = null;
  }

  function trackAnchor(el: HTMLElement, scrollRoot: HTMLElement | null) {
    stopAnchorTracking();
    const readRects = () => {
      anchorRect.value = el.getBoundingClientRect();
      scrollRootRect.value = scrollRoot
        ? scrollRoot.getBoundingClientRect()
        : null;
    };
    // Read synchronously once so the overlay never flashes at the popup
    // geometry before the first frame.
    readRects();
    const loop = () => {
      readRects();
      anchorRectRafId = requestAnimationFrame(loop);
    };
    anchorRectRafId = requestAnimationFrame(loop);
  }

  watch(
    dockedAnchorCandidate,
    (candidate) =>
      candidate
        ? trackAnchor(candidate.el, candidate.scrollRoot)
        : stopAnchorTracking(),
    { immediate: true },
  );

  onUnmounted(stopAnchorTracking);

  /** Overlay box while docked inline; the figure keeps its own box size. */
  const dockedStyle = computed(() => {
    const rect = anchorRect.value;
    if (!rect) return {};
    return {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  });

  /**
   * Containment clip while docked inline: the overlay is position:fixed, so
   * it is not clipped by the scroll container's overflow like an in-flow
   * player was — clip it to the container's bounds explicitly, or the video
   * would paint over neighboring chrome (chat input below, sticky header
   * above) while partially scrolled out. Fully inside: no clip at all.
   */
  const dockedClipStyle = computed(() => {
    const rect = anchorRect.value;
    const container = scrollRootRect.value;
    if (!rect || !container) return {};
    const insetTop = Math.max(0, container.top - rect.top);
    const insetRight = Math.max(0, rect.right - container.right);
    const insetBottom = Math.max(0, rect.bottom - container.bottom);
    const insetLeft = Math.max(0, container.left - rect.left);
    if (!insetTop && !insetRight && !insetBottom && !insetLeft) return {};
    return {
      clipPath: `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px)`,
    };
  });

  // Lift the chat column only while the popup chrome (or hidden window) is
  // up: docked inline the player deliberately stays under the sticky chrome.
  const showsPopupChrome = computed(
    () =>
      Boolean(launchedVideo.value) &&
      !dockedInline.value &&
      !windowHidden.value,
  );
  watch(
    showsPopupChrome,
    (visible) => {
      document.body.classList.toggle('has-floating-video', visible);
    },
    { immediate: true },
  );

  onUnmounted(() => {
    document.body.classList.remove('has-floating-video');
  });

  /**
   * Minimize the popup window (the "_" button): window management, not
   * playback control — it docks the video (inline over the figure when one
   * is visible, hidden-but-playing when there is nothing to dock onto), like
   * the playlist transport's popup-visibility toggle. Playback keeps
   * running.
   */
  function minimize() {
    dockPlayback();
  }

  /**
   * Stop playback (the X button): kills the video entirely, clearing the
   * launched popup, exactly like the transport bar's dedicated Stop button.
   */
  function stop() {
    stopActivePlayback();
  }

  return {
    launchedVideo,
    dockedInline,
    dockedStyle,
    dockedClipStyle,
    windowHidden,
    showsPopupChrome,
    popupStyle,
    embedSrc,
    isDirectVideo,
    isUnembeddable,
    setPlayerElement,
    opacityPercent,
    setOpacity,
    startDrag,
    startResize,
    minimize,
    stop,
  };
}
