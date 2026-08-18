import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';

import { toEmbedUrl } from './helpers/media/to-embed-url.helper';
import { findAnchorScrollRoot } from './helpers/ui/find-anchor-scroll-root.helper';
import {
  dockedAnchorElement,
  engagePlayback,
  registerAnchorCandidate,
  setAnchorCandidateInView,
  unregisterAnchorCandidate,
} from './playback-anchor.state';
import type { AnchorCandidate } from './playback-anchor.state.types';
import type { TemplateRefTarget } from './use-playback-anchor.types';
import { launchedVideo, launchVideo } from './video-playback.state';

/**
 * Clearance from the top of the viewport before a figure counts as "in
 * view": the chat's sticky column headers sit at top-12 (48px); slipping
 * under them flips the player to floating slightly before the overlay could
 * paint over the chrome. Only used when the figure has no own scroll
 * container (the container's bounds handle containment otherwise).
 */
const TOP_CHROME_CLEARANCE_PX = 56;

/**
 * Minimum visible ratio before the figure counts as in view: the player
 * pops out into the floating window the moment the figure starts sliding
 * past the scroll container's top or bottom edge (fully visible = in view).
 * Slightly below 1.0 to absorb sub-pixel rounding.
 */
const FULLY_VISIBLE_RATIO = 0.99;

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
  const anchorElement = ref<HTMLElement | null>(null);

  let candidate: AnchorCandidate | null = null;
  let observer: IntersectionObserver | null = null;

  const dockCondition = options?.dockCondition ?? (() => true);

  const videoUrl = computed(() => item.value.videoUrl);
  const isUnembeddable = computed(
    () => Boolean(videoUrl.value) && !toEmbedUrl(videoUrl.value),
  );

  const isLaunchedHere = computed(
    () => launchedVideo.value?.videoUrl === videoUrl.value,
  );

  /** The floating player currently overlays this figure's media box. */
  const isDockedHere = computed(
    () =>
      isLaunchedHere.value &&
      dockedAnchorElement.value !== null &&
      dockedAnchorElement.value === anchorElement.value,
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
    engagePlayback();
    if (candidate) setAnchorCandidateInView(videoUrl.value, candidate, true);
    launchVideo({ videoUrl: item.value.videoUrl, title: item.value.title });
  }

  onMounted(() => {
    if (!anchorElement.value) return;
    const scrollRoot = findAnchorScrollRoot(anchorElement.value);
    candidate = registerAnchorCandidate(
      videoUrl.value,
      anchorElement.value,
      scrollRoot,
      dockCondition,
    );
    observer = new IntersectionObserver(
      ([entry]) => {
        if (candidate && anchorElement.value) {
          setAnchorCandidateInView(
            videoUrl.value,
            candidate,
            entry.isIntersecting &&
              entry.intersectionRatio >= FULLY_VISIBLE_RATIO,
          );
        }
      },
      scrollRoot
        ? { root: scrollRoot, threshold: [0, FULLY_VISIBLE_RATIO] }
        : {
            threshold: [0, FULLY_VISIBLE_RATIO],
            rootMargin: `-${TOP_CHROME_CLEARANCE_PX}px 0px 0px 0px`,
          },
    );
    observer.observe(anchorElement.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
    observer = null;
    if (candidate) {
      unregisterAnchorCandidate(videoUrl.value, candidate);
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
