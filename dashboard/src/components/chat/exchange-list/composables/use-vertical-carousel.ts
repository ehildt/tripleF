import {
  computed,
  getCurrentInstance,
  type InjectionKey,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  type Ref,
  ref,
  watch,
} from 'vue';

const SCROLL_BOTTOM_THRESHOLD_PX = 8;

/**
 * Reactive scroll state shared with every carousel slide so each can compute
 * its own blend opacity and reset its internal scroll when it becomes the
 * active section.
 */
import type { CarouselScrollState } from './use-vertical-carousel.types';

export const CAROUSEL_SCROLL_STATE: InjectionKey<CarouselScrollState> = Symbol(
  'carousel-scroll-state',
);

/**
 * Drive a vertical carousel of full-height sections. Each section is a slide
 * the container snaps to; scrolling crossfades between them (see
 * use-carousel-blend). Also owns the auto-scroll/pin behavior: a new prompt
 * snaps to the newest section, the pin releases once the first response
 * content arrives so the user can read from the top, and a manual scroll-away
 * is preserved until the response finishes.
 *
 * `activeAssistantResponseStarted` releases the bottom pin: once the first
 * response content arrives, the view stops chasing the growing tail so the
 * user can start reading from the top of the response.
 */
export function useVerticalCarousel(
  isCompact: Ref<boolean>,
  activeAssistantExchangeId: Ref<string | null>,
  activeAssistantResponseStarted: Ref<boolean>,
) {
  const scrollContainerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);
  const viewportHeight = ref(0);
  const shouldAutoScroll = ref(true);
  // When true, the container-creation auto-scroll-to-bottom is skipped. Used
  // when switching from the native list so the carousel can navigate to the
  // history item the user was reading instead of jumping to the bottom.
  const skipInitialScroll = ref(false);
  const savedScrollTop = ref<number | null>(null);
  // True while a programmatic scroll (auto-scroll-to-bottom, snap-to-section)
  // is in flight, so callers can tell a user-initiated scroll from one the
  // composable triggered itself.
  const isProgrammaticScroll = ref(false);
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

  const activeSectionIndex = computed(() => {
    if (viewportHeight.value === 0) return 0;
    return Math.round(scrollTop.value / viewportHeight.value);
  });

  const previousActiveSectionIndex = ref(0);
  watch(activeSectionIndex, (_, previous) => {
    previousActiveSectionIndex.value = previous ?? 0;
  });

  // Set when a history click should land the target section at its top
  // regardless of scroll direction (see scrollToSection's resetToTop).
  const forceTopOnNextTransition = ref(false);

  function getContainer(): HTMLElement | null {
    return scrollContainerRef.value;
  }

  function isAtBottom(container: HTMLElement): boolean {
    return (
      container.scrollTop +
        container.clientHeight +
        SCROLL_BOTTOM_THRESHOLD_PX >=
      container.scrollHeight
    );
  }

  function scrollToBottom() {
    shouldAutoScroll.value = true;
    const container = getContainer();
    if (!container || container.scrollHeight === 0) return;

    isProgrammaticScroll.value = true;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      isProgrammaticScroll.value = false;
    });
  }

  /** Snap the carousel to the section at `index` (its top edge). When
   * `resetToTop` is true the target section is forced to start from its top
   * (history-click navigation) instead of the direction-based reset. */
  function scrollToSection(index: number, smooth = false, resetToTop = false) {
    const container = getContainer();
    if (!container) return;
    if (resetToTop) forceTopOnNextTransition.value = true;
    const top = index * container.clientHeight;
    isProgrammaticScroll.value = true;
    container.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    // Smooth scrolls fire many scroll events; keep the flag set until the
    // snap settles so those intermediate events are not treated as user
    // scrolls. Auto scrolls settle synchronously.
    if (smooth) {
      window.setTimeout(() => {
        isProgrammaticScroll.value = false;
      }, 400);
    } else {
      isProgrammaticScroll.value = false;
    }
  }

  function saveCurrentScrollPosition() {
    const container = getContainer();
    if (!container) return;
    savedScrollTop.value = container.scrollTop;
  }

  function restoreSavedScrollPosition() {
    const container = getContainer();
    const position = savedScrollTop.value;
    if (!container || position === null) return;

    requestAnimationFrame(() => {
      // Only restore when the user is still away from the bottom. If the user
      // already scrolled back down, keep them there and discard the stale saved
      // position.
      if (!isAtBottom(container)) {
        container.scrollTop = position;
      }
      savedScrollTop.value = null;
    });
  }

  function onScroll() {
    const container = getContainer();
    if (!container) return;

    scrollTop.value = container.scrollTop;
    viewportHeight.value = container.clientHeight;

    const atBottom = isAtBottom(container);
    shouldAutoScroll.value = atBottom;

    if (atBottom) {
      // Returning to the bottom invalidates any saved position so finishing a
      // response does not snap the user back to an old scroll offset.
      savedScrollTop.value = null;
      return;
    }

    if (
      activeAssistantExchangeId.value !== null &&
      savedScrollTop.value === null
    ) {
      saveCurrentScrollPosition();
    }
  }

  function keepAtBottomIfNeeded() {
    const container = getContainer();
    if (!container) return;
    // A pending mode-switch restore owns the scroll position until it
    // navigates; an auto-bottom queued here would stomp it.
    if (skipInitialScroll.value) return;
    // If the user has already chosen to follow the stream, keep them pinned
    // to the bottom whenever the container's content changes size (text,
    // images, lazy-loaded media, etc.). Checking shouldAutoScroll instead of
    // isAtBottom avoids a race where a sudden layout growth briefly reports
    // the user as "not at bottom" and misses the snap.
    if (shouldAutoScroll.value) {
      scrollToBottom();
    }
  }

  // Thinking text streams into the exchange-activity element and has its own
  // internal autoscroll — it must not pull the whole exchange list along.
  // Only mutations outside that element (actual response data) may trigger
  // autoscroll.
  function isActivityMutation(mutation: MutationRecord): boolean {
    const target = mutation.target;
    const element = target instanceof Element ? target : target.parentElement;
    return element?.closest('[data-exchange-activity]') != null;
  }

  function observeContainer(container: HTMLElement) {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        viewportHeight.value = container.clientHeight;
        keepAtBottomIfNeeded();
      });
      resizeObserver.observe(container);
    }

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver((mutations) => {
        if (mutations.length > 0 && mutations.every(isActivityMutation)) return;
        keepAtBottomIfNeeded();
      });
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  function unobserveContainer() {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    resizeObserver = null;
    mutationObserver = null;
  }

  watch(
    scrollContainerRef,
    (container, previousContainer) => {
      if (previousContainer) {
        unobserveContainer();
      }
      if (container) {
        observeContainer(container);
        if (!skipInitialScroll.value) {
          scrollToBottom();
        }
      }
    },
    { immediate: true },
  );

  watch(isCompact, () => {
    shouldAutoScroll.value = true;
    scrollToBottom();
  });

  watch(activeAssistantResponseStarted, (started) => {
    if (!started) return;
    // The first response content has arrived: release the bottom pin so the
    // user can read from the start instead of chasing the streaming tail.
    // This is not a manual scroll-away, so no position is saved — finishing
    // the response must not yank the view back.
    shouldAutoScroll.value = false;
  });

  watch(activeAssistantExchangeId, (current, previous) => {
    if (current === null) {
      if (previous !== null && savedScrollTop.value !== null) {
        restoreSavedScrollPosition();
      }
      return;
    }

    // A new (or different) assistant exchange becoming active means the user
    // just sent a prompt: snap to the bottom of that exchange regardless of
    // the previous scroll state. Sending is an explicit "take me to the
    // response" gesture, so neither a saved position nor a scrolled-away
    // state may suppress the scroll.
    if (current !== previous) {
      savedScrollTop.value = null;
      scrollToBottom();
      return;
    }

    if (shouldAutoScroll.value) {
      scrollToBottom();
    }
  });

  if (getCurrentInstance()) {
    onMounted(async () => {
      await nextTick();
      scrollToBottom();
    });

    onUnmounted(() => {
      unobserveContainer();
    });

    provide(CAROUSEL_SCROLL_STATE, {
      scrollTop,
      viewportHeight,
      activeSectionIndex,
      previousActiveSectionIndex,
      forceTopOnNextTransition,
      scrollToSection,
    });
  }

  return {
    scrollContainerRef,
    scrollToBottom,
    scrollToSection,
    onScroll,
    activeSectionIndex,
    isProgrammaticScroll,
    shouldAutoScroll,
    skipInitialScroll,
  };
}
