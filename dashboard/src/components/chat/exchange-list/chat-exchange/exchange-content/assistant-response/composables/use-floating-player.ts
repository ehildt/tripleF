import { useEventListener } from '@vueuse/core';
import {
  type ComponentPublicInstance,
  computed,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
  watch,
} from 'vue';

import {
  popoutEnabled,
  releaseFloatingPopupRect,
} from './popout-settings.state';
import { usePausablePlayer } from './use-pausable-player';
import { usePopupGeometry } from './use-popup-geometry';
import {
  activePlaybackVideoUrl,
  closeLaunchedVideo,
  floatingPopupOpacity,
  launchedVideo,
  setActivePlayback,
} from './video-playback.state';

type TemplateRefTarget = Element | ComponentPublicInstance | null;

/**
 * Floating-player state for an embedded video figure.
 *
 * Single-playback is structural: only the active playback mounts a real
 * player — every other figure renders a poster. Clicking a poster makes its
 * figure the active playback, which unmounts the previously mounted player
 * in the same render flush and mounts this one with autoplay. Because at
 * most one player ever exists on the page, Chrome/YouTube's cross-embed
 * force-mute has nothing to coordinate, and the programmatic start keeps
 * its sound (real click activation plus autoplay delegation).
 *
 * The mounted player is never re-parented (that would reload the iframe and
 * kill playback). Once it scrolls out of view, the media element flips to
 * `position: fixed` and becomes a draggable popup. Closing the popup docks
 * the media back inline — playback continues uninterrupted, and the popup
 * stays dismissed until the video is resumed or explicitly played again.
 */
export function useFloatingPlayer(item: Ref<{ videoUrl: string }>) {
  const cardElement = ref<HTMLElement | null>(null);
  const mediaElement = ref<HTMLElement | null>(null);
  const isInView = ref(false);
  const wasDismissed = ref(false);

  let observer: IntersectionObserver | null = null;

  const videoUrl = computed(() => item.value.videoUrl);
  const {
    playerSrc,
    isDirectVideo,
    isUnembeddable,
    isYouTubeEmbed,
    setPlayerElement,
  } = usePausablePlayer(videoUrl, (playing) => {
    // Resuming playback after a pause is fresh play intent: re-arm floating.
    if (playing) wasDismissed.value = false;
  });

  /** Mounting this figure's player autoplays it — mount means play intent. */
  const autoplaySrc = computed(() => {
    if (!isYouTubeEmbed.value || !playerSrc.value) return playerSrc.value;
    const separator = playerSrc.value.includes('?') ? '&' : '?';
    return `${playerSrc.value}${separator}autoplay=1`;
  });

  const isActivePlayback = computed(
    () => activePlaybackVideoUrl.value === item.value.videoUrl,
  );

  /**
   * Only the active playback mounts a real player, and only while no
   * launched playlist popup is up. Everything else renders a poster.
   */
  const shouldMountPlayer = computed(
    () =>
      isActivePlayback.value && !launchedVideo.value && !isUnembeddable.value,
  );

  /**
   * The mounted player may float once scrolled out of view, unless the user
   * dismissed the popup — a dismissal sticks until playback is resumed or
   * the video is explicitly played again. Since only one player is mounted
   * at a time, popups can never stack.
   */
  const isFloating = computed(
    () =>
      popoutEnabled.value &&
      isActivePlayback.value &&
      !isInView.value &&
      !wasDismissed.value &&
      shouldMountPlayer.value,
  );

  const {
    popupStyle: geometryStyle,
    startDrag,
    startResize,
    setOpacity,
  } = usePopupGeometry();
  const popupStyle = computed(() =>
    isFloating.value ? geometryStyle.value : {},
  );

  useEventListener(window, 'blur', onWindowBlur);

  onMounted(() => {
    if (!cardElement.value) return;
    observer = new IntersectionObserver(
      ([entry]) => {
        isInView.value = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    observer.observe(cardElement.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
    document.body.classList.remove('has-floating-video');
  });

  /**
   * While a video floats, lift the chat's center column above the sticky
   * toolbar and panels: position:sticky always creates a stacking context,
   * so the popup could otherwise never paint above them.
   */
  watch(isFloating, (floating) => {
    document.body.classList.toggle('has-floating-video', floating);
  });

  function setCardElement(el: TemplateRefTarget) {
    cardElement.value = el instanceof HTMLElement ? el : null;
  }

  function setMediaElement(el: TemplateRefTarget) {
    mediaElement.value = el instanceof HTMLElement ? el : null;
  }

  /**
   * Fallback engagement signal for iframes: clicks inside an iframe never
   * reach the parent document's pointer events — but they blur the window
   * and turn the iframe into the active element.
   */
  function onWindowBlur() {
    const active = document.activeElement;
    if (
      active instanceof HTMLIFrameElement &&
      mediaElement.value?.contains(active)
    ) {
      engage();
    }
  }

  /**
   * Make this figure the active playback. A launched playlist popout hands
   * over playback and closes; the previously mounted player unmounts in the
   * same render flush and this figure's player mounts with autoplay.
   * Activating from the poster state (or back from another video) is fresh
   * play intent, so it re-arms floating after a dismissal — while mere
   * interaction with the already-active inline player does not.
   */
  function engage() {
    if (!isActivePlayback.value) wasDismissed.value = false;
    if (launchedVideo.value) closeLaunchedVideo();
    setActivePlayback(item.value.videoUrl);
  }

  /**
   * Dock the popup back into the figure; playback continues inline and the
   * popup does not reappear on later scroll-outs — resuming playback (or a
   * fresh engage from the poster state) re-arms it.
   */
  function dismissFloating() {
    wasDismissed.value = true;
    releaseFloatingPopupRect();
  }

  return {
    setCardElement,
    setMediaElement,
    setPlayerElement,
    shouldMountPlayer,
    isFloating,
    popupStyle,
    floatingPopupOpacity,
    playerSrc: autoplaySrc,
    isDirectVideo,
    isUnembeddable,
    engage,
    dismissFloating,
    startDrag,
    startResize,
    setOpacity,
  };
}
