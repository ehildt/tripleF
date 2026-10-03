import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';

import { toEmbedUrl } from '@/composables/helpers/to-embed-url.helper';
import { usePlaybackSession } from '@/composables/use-playback-session';
import { usePlaybackAnchorStore } from '@/stores/playback-anchor';
import type { AnchorCandidate } from '@/stores/playback-anchor.types';

import { findAnchorScrollRoot } from './helpers/find-anchor-scroll-root.helper';
import type { TemplateRefTarget } from './use-playback-anchor.types';

/**
 * Clearance from the top of the viewport before a figure counts as "in
 * view": the chat's sticky column headers sit at top-12 (48px); slipping
 * under them flips the player to floating slightly before the overlay could
 * paint over the chrome. Only used when the figure has no own scroll
 * container (the container's bounds handle containment otherwise).
 */
const TOP_CHROME_CLEARANCE_PX = 56;

/**
 * A figure counts as in view when its vertical center sits inside the
 * scroll root, inset by this margin — never a "fully visible" ratio: full
 * visibility is unreachable for figures taller than the visible region
 * (big/wide videos, short windows), so the video popped out on scroll and
 * could not dock back, with the breakage varying by monitor and window
 * size. A center point is reachable for any figure size and viewport.
 */
const DOCK_EDGE_INSET_PX = 24;

/**
 * Dense ratio steps so the observer callback keeps firing while the figure
 * slides through the scroller; center-in-bounds is evaluated per callback
 * and the steps only exist to keep the callbacks flowing.
 */
const VISIBILITY_RATIO_STEPS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Anchor wiring for one video figure: registers the figure's media box as
 * the playback anchor for its URL and launches the video into the app-level
 * floating player on engagement. The figure never mounts a player itself —
 * it renders a poster until it is the launched video; then the floating
 * player overlays this box purely via CSS positioning (the iframe is never
 * re-parented, so playback never interrupts). Scrolled out (or unmounted by
 * a tab/conversation switch), the same launched video simply shows as the
 * floating popup instead.
 */
export function usePlaybackAnchor(
  item: Ref<{ videoUrl: string; title?: string }>,
  options?: { dockCondition?: () => boolean },
) {
  const playbackAnchorStore = usePlaybackAnchorStore();
  const playback = usePlaybackSession();

  const anchorElement = ref<HTMLElement | null>(null);

  let candidate: AnchorCandidate | null = null;
  let observer: IntersectionObserver | null = null;

  const dockCondition = options?.dockCondition ?? (() => true);

  const videoUrl = computed(() => item.value.videoUrl);
  const isUnembeddable = computed(
    () => Boolean(videoUrl.value) && !toEmbedUrl(videoUrl.value),
  );

  const isLaunchedHere = computed(
    () => playback.launchedVideo.value?.videoUrl === videoUrl.value,
  );

  /** The floating player currently overlays this figure's media box. */
  const isDockedHere = computed(
    () =>
      isLaunchedHere.value &&
      playback.dockedAnchorElement.value !== null &&
      playback.dockedAnchorElement.value === anchorElement.value,
  );

  /**
   * Launch this figure's video into the app-level floating player. Same-URL
   * re-engagement keeps the mounted player (keyed by URL) and just resets
   * the dock mode — a click after a dismissal re-follows the anchor. The
   * candidate is optimistically in-view: a poster click implies the figure
   * is visible right now; the observer corrects the flag on its next
   * callback if it is not.
   */
  function engage() {
    playbackAnchorStore.engagePlayback();
    if (candidate) {
      playbackAnchorStore.setAnchorCandidateInView(
        videoUrl.value,
        candidate,
        true,
      );
    }
    playback.launchVideo({
      videoUrl: item.value.videoUrl,
      title: item.value.title,
    });
  }

  onMounted(() => {
    if (!anchorElement.value) return;
    const scrollRoot = findAnchorScrollRoot(anchorElement.value);
    candidate = playbackAnchorStore.registerAnchorCandidate(
      videoUrl.value,
      anchorElement.value,
      scrollRoot,
      dockCondition,
    );
    observer = new IntersectionObserver(
      ([entry]) => {
        if (candidate && anchorElement.value) {
          const rect = entry.boundingClientRect;
          const centerY = rect.top + rect.height / 2;
          const rootTop = entry.rootBounds?.top ?? 0;
          const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
          playbackAnchorStore.setAnchorCandidateInView(
            videoUrl.value,
            candidate,
            entry.isIntersecting &&
              centerY >= rootTop + DOCK_EDGE_INSET_PX &&
              centerY <= rootBottom - DOCK_EDGE_INSET_PX,
          );
        }
      },
      scrollRoot
        ? { root: scrollRoot, threshold: VISIBILITY_RATIO_STEPS }
        : {
            threshold: VISIBILITY_RATIO_STEPS,
            rootMargin: `-${TOP_CHROME_CLEARANCE_PX}px 0px 0px 0px`,
          },
    );
    observer.observe(anchorElement.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
    observer = null;
    if (candidate) {
      playbackAnchorStore.unregisterAnchorCandidate(videoUrl.value, candidate);
      candidate = null;
    }
  });

  function setAnchorElement(el: TemplateRefTarget) {
    anchorElement.value = el instanceof HTMLElement ? el : null;
  }

  return {
    setAnchorElement,
    isLaunchedHere,
    isDockedHere,
    isUnembeddable,
    engage,
  };
}
