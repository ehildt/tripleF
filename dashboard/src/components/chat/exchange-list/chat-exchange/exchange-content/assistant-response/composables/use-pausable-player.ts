import {
  type ComponentPublicInstance,
  computed,
  nextTick,
  onUnmounted,
  type Ref,
  ref,
  watch,
} from 'vue';

import { loadYouTubeIframeApi } from '../templates/videolist-response/video-list-item/helpers/load-youtube-iframe-api.helper';
import { toEmbedUrl } from './helpers/to-embed-url.helper';
import {
  registerActivePlayerControls,
  setActivePlaybackPlaying,
  unregisterActivePlayerControls,
} from './video-playback.state';

type TemplateRefTarget = Element | ComponentPublicInstance | null;
type PlayerControls = { play(): void; pause(): void };
type YouTubePlayerHandle = {
  destroy(): void;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
};

/**
 * Shared player wiring for every embedded video in the app: resolves the
 * embed src with provider API flags and attaches the YouTube IFrame API for
 * true play state. Single-playback is guaranteed structurally — only the
 * app-level floating player is mounted at any time (see use-floating-player-host)
 * — so this composable never needs to pause other players.
 */
export function usePausablePlayer(
  videoUrl: Ref<string>,
  onPlayingChange?: (playing: boolean) => void,
  onEnded?: () => void,
) {
  const playerElement = ref<HTMLElement | null>(null);
  let ytPlayer: YouTubePlayerHandle | null = null;
  let detachDirectVideoListeners: (() => void) | null = null;
  let playerControls: PlayerControls | null = null;
  let endNotified = false;
  let endPollTimer: number | undefined;

  /** Report play state to the shared transport state and the host. */
  function reportPlaying(playing: boolean) {
    setActivePlaybackPlaying(playing);
    onPlayingChange?.(playing);
  }

  /** Mount means autoplay intent — register transport controls optimistically. */
  function registerControls(controls: PlayerControls) {
    playerControls = controls;
    registerActivePlayerControls(controls);
    setActivePlaybackPlaying(true);
  }

  function unregisterControls() {
    if (!playerControls) return;
    unregisterActivePlayerControls(playerControls);
    playerControls = null;
  }

  /** Vimeo embeds (api=1) accept legacy postMessage commands without an SDK. */
  function postVimeoCommand(method: 'play' | 'pause') {
    const frame = playerElement.value;
    if (frame instanceof HTMLIFrameElement) {
      frame.contentWindow?.postMessage(JSON.stringify({ method }), '*');
    }
  }

  function registerVimeoControls() {
    registerControls({
      play: () => {
        postVimeoCommand('play');
        setActivePlaybackPlaying(true);
      },
      pause: () => {
        postVimeoCommand('pause');
        setActivePlaybackPlaying(false);
      },
    });
  }

  /**
   * Fire onEnded at most once per playback. Reset when the player goes back
   * to PLAYING, so a replay (seek back + play to the end again) re-arms it.
   */
  function notifyEndedOnce() {
    if (endNotified) return;
    endNotified = true;
    onEnded?.();
  }

  /**
   * Safety net for YouTube's swallowed ENDED state change: scrubbing the
   * playhead to (near) the end — or the video ending before the API attach
   * completed — can end playback without the event ever firing. Polling the
   * player state catches the endscreen regardless; the event path in
   * onStateChange still wins when it fires.
   */
  function startYouTubeEndPolling() {
    stopYouTubeEndPolling();
    endPollTimer = window.setInterval(() => {
      if (!ytPlayer) return;
      try {
        if (ytPlayer.getPlayerState() === window.YT?.PlayerState?.ENDED) {
          notifyEndedOnce();
        }
      } catch {
        /* player not ready yet */
      }
    }, 1000);
  }

  function stopYouTubeEndPolling() {
    if (endPollTimer !== undefined) {
      window.clearInterval(endPollTimer);
      endPollTimer = undefined;
    }
  }

  const embedBase = computed(() => toEmbedUrl(videoUrl.value) ?? '');
  const isDirectVideo = computed(
    () => Boolean(videoUrl.value) && embedBase.value === videoUrl.value,
  );
  const isUnembeddable = computed(
    () => Boolean(videoUrl.value) && !embedBase.value,
  );
  const isYouTubeEmbed = computed(() =>
    /youtube(?:-nocookie)?\.com\/embed\//.test(embedBase.value),
  );
  const isVimeoEmbed = computed(() =>
    /player\.vimeo\.com\/video\//.test(embedBase.value),
  );

  /** Provider API flags so we can track play state. */
  const playerSrc = computed(() => {
    const separator = embedBase.value.includes('?') ? '&' : '?';
    if (isYouTubeEmbed.value) {
      const origin = encodeURIComponent(window.location.origin);
      return `${embedBase.value}${separator}enablejsapi=1&origin=${origin}`;
    }
    if (isVimeoEmbed.value) return `${embedBase.value}${separator}api=1`;
    return embedBase.value;
  });

  function setPlayerElement(el: TemplateRefTarget) {
    playerElement.value = el instanceof HTMLElement ? el : null;
  }

  /** Direct <video> elements report play state through native events. */
  function attachDirectVideoListeners(el: HTMLVideoElement) {
    const onPlay = () => reportPlaying(true);
    const onPausedOrEnded = () => reportPlaying(false);
    const onNativeEnded = () => onEnded?.();
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPausedOrEnded);
    el.addEventListener('ended', onPausedOrEnded);
    el.addEventListener('ended', onNativeEnded);
    registerControls({
      play: () => {
        el.play().catch(() => undefined);
      },
      pause: () => el.pause(),
    });
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPausedOrEnded);
      el.removeEventListener('ended', onPausedOrEnded);
      el.removeEventListener('ended', onNativeEnded);
    };
  }

  async function attachYouTubePlayer() {
    if (!isYouTubeEmbed.value || !playerElement.value || ytPlayer) return;
    await loadYouTubeIframeApi();
    if (!playerElement.value || ytPlayer) return;

    // The API takes over the iframe against this host. Without it, nocookie
    // embeds get re-initialized on the wrong domain (youtube.com), which
    // reloads the player mid-playback — Chrome then force-mutes the
    // programmatic restart and shows a buffering spinner.
    const host = /youtube-nocookie\.com/.test(embedBase.value)
      ? 'https://www.youtube-nocookie.com'
      : undefined;

    ytPlayer = new window.YT!.Player(playerElement.value, {
      ...(host ? { host } : {}),
      events: {
        onStateChange: (event) => {
          const states = window.YT?.PlayerState;
          if (event.data === states?.PLAYING) {
            endNotified = false;
            reportPlaying(true);
          }
          if (event.data === states?.PAUSED || event.data === states?.ENDED)
            reportPlaying(false);
          if (event.data === states?.ENDED) notifyEndedOnce();
        },
      },
    });

    registerControls({
      play: () => ytPlayer?.playVideo(),
      pause: () => ytPlayer?.pauseVideo(),
    });

    endNotified = false;
    if (onEnded) startYouTubeEndPolling();
  }

  watch(
    playerElement,
    async (el) => {
      // Teardown the previous wiring first — Vue batches synchronous ref
      // changes (keyed swap: el1 → null → el2) into a single watch fire, so
      // the null branch cannot be trusted to run between players. Every
      // fire must leave a clean slate before attaching the new element.
      detachDirectVideoListeners?.();
      detachDirectVideoListeners = null;
      unregisterControls();
      stopYouTubeEndPolling();
      ytPlayer?.destroy();
      ytPlayer = null;

      if (!el) return;
      if (isDirectVideo.value) {
        if (el instanceof HTMLVideoElement)
          detachDirectVideoListeners = attachDirectVideoListeners(el);
        return;
      }
      await nextTick();
      if (isVimeoEmbed.value) {
        registerVimeoControls();
        return;
      }
      void attachYouTubePlayer();
    },
    { immediate: true },
  );

  onUnmounted(() => {
    detachDirectVideoListeners?.();
    detachDirectVideoListeners = null;
    unregisterControls();
    stopYouTubeEndPolling();
    ytPlayer?.destroy();
    ytPlayer = null;
  });

  return {
    playerSrc,
    isDirectVideo,
    isUnembeddable,
    isYouTubeEmbed,
    setPlayerElement,
  };
}
