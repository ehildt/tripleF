import { computed, onUnmounted, ref, watch } from 'vue';

import { usePausablePlayer } from '@/components/widgets/floating-player/composables/use-pausable-player';
import { usePopupGeometry } from '@/components/widgets/floating-player/composables/use-popup-geometry';
import type { PlaybackSession } from '@/composables/create-playback-session/create-playback-session';
import { usePlaybackAnchorRegistry } from '@/composables/use-playback-anchor-registry/use-playback-anchor-registry';
import { usePopoutSettingsStore } from '@/stores/widgets/popout-settings/popout-settings.store';

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
 * comes from usePausablePlayer. The playback session is the single source of
 * truth for what is playing; this host applies the session's toggle request
 * to its own player and reports observed state back.
 */
export function useFloatingPlayerHost(session: PlaybackSession) {
  const playbackAnchorStore = usePlaybackAnchorRegistry();
  const popoutSettingsStore = usePopoutSettingsStore();

  const geometry = usePopupGeometry();

  const launchedVideo = computed(() => session.launchedVideo.value);
  const launchedVideoUrl = computed(() => launchedVideo.value?.videoUrl ?? '');
  const pausablePlayer = usePausablePlayer(launchedVideoUrl, {
    onEnded: onVideoEnded,
    reportPlaying: session.reportPlaying,
    reportControlSupported: session.reportControlSupported,
  });

  // The session issues a toggle request as data; apply it to this player.
  watch(
    () => session.playbackToggleRequestId.value,
    () => pausablePlayer.togglePlayback(),
  );

  /** Playlist autoplay: an ended video hands over to the next queue entry. */
  function onVideoEnded() {
    if (
      session.playlistAutoplayEnabled.value &&
      session.launchedFromPlaylist.value
    ) {
      session.playNextPlaylistVideo();
    }
  }

  /** Autoplay on launch where the provider allows it. */
  const embedSrc = computed(() => {
    if (!launchedVideo.value || !pausablePlayer.playerSrc.value) return '';
    if (
      /youtube(?:-nocookie)?\.com\/embed\//.test(pausablePlayer.playerSrc.value)
    ) {
      const separator = pausablePlayer.playerSrc.value.includes('?')
        ? '&'
        : '?';
      return `${pausablePlayer.playerSrc.value}${separator}autoplay=1`;
    }
    return pausablePlayer.playerSrc.value;
  });

  const opacityPercent = computed(() =>
    Math.round(session.floatingPopupOpacity.value * 100),
  );

  // ---------- docked-inline vs floating vs hidden ----------

  const dockedInline = computed(() => session.dockedInline.value);

  /**
   * Popout autodock off: once the anchor is lost, latch into floating mode
   * (mirroring the old float latch). Only latches when a registered figure
   * reports not-in-view — never on launch itself, where registration is
   * optimistic-in-view until the observer's first callback.
   */
  watch(
    [
      () => session.visibleAnchorCandidate.value,
      () => playbackAnchorStore.playbackDockMode.value,
    ],
    () => {
      if (
        popoutSettingsStore.popoutEnabled &&
        !popoutSettingsStore.popoutAutoDock &&
        playbackAnchorStore.playbackDockMode.value === 'auto' &&
        launchedVideo.value &&
        !session.visibleAnchorCandidate.value
      ) {
        playbackAnchorStore.latchFloating();
      }
    },
    { immediate: true },
  );

  // Resuming paused playback re-follows the anchor (old dismissal re-arm).
  watch(
    () => session.activePlaybackPlaying.value,
    (playing) => {
      if (
        playing &&
        playbackAnchorStore.playbackDockMode.value === 'dock-dismissed'
      ) {
        playbackAnchorStore.engagePlayback();
      }
    },
  );

  const windowHidden = computed(
    () =>
      playbackAnchorStore.playbackDockMode.value === 'dock-dismissed' ||
      (popoutSettingsStore.popoutHideOnPlaylist &&
        session.launchedFromPlaylist.value) ||
      (!popoutSettingsStore.popoutEnabled &&
        Boolean(launchedVideo.value) &&
        !dockedInline.value),
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
    () => session.dockedAnchorCandidate.value,
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
   * Per-caller delegation objects: the consumer reaches into their members
   * directly; creating a second instance would fork the popup's drag/opacity
   * state or the player's wiring.
   */
  return {
    launchedVideo,
    dockedInline,
    dockedStyle,
    dockedClipStyle,
    windowHidden,
    embedSrc,
    opacityPercent,
    geometry,
    pausablePlayer,
  };
}
