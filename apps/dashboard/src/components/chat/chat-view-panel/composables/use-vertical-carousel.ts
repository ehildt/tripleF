import { storeToRefs } from 'pinia';
import { nextTick, onMounted, onUnmounted, type Ref, ref, watch } from 'vue';

import { useVerticalCarouselStore } from '@/stores/vertical-carousel';

import { useActiveConversation } from './use-active-conversation';
import { useProgrammaticScrollWindow } from './use-programmatic-scroll-window';

const SCROLL_BOTTOM_THRESHOLD_PX = 8;

/**
 * Drive a vertical carousel of full-height sections. Each section is a slide
 * the container snaps to; scrolling crossfades between them (see
 * use-carousel-blend). Also owns the auto-scroll/pin behavior: a new prompt
 * snaps to the newest section, the pin releases once the first response
 * content arrives so the user can read from the top, and a manual scroll-away
 * is preserved until the response finishes.
 *
 * The reactive scroll state the slides read lives in the vertical-carousel
 * store (single source of truth); this composable owns the component-scoped
 * DOM observation and auto-scroll/pin behavior and writes the live metrics
 * back into the store.
 *
 * `activeAssistantResponseStarted` releases the bottom pin: once the first
 * response content arrives, the view stops chasing the growing tail so the
 * user can start reading from the top of the response.
 */
export function useVerticalCarousel(isCompact: Ref<boolean>) {
  const { activeAssistantExchangeId, activeAssistantResponseStarted } =
    useActiveConversation();

  const verticalCarouselStore = useVerticalCarouselStore();
  const { scrollContainerRef, scrollTop, viewportHeight, activeSectionIndex } =
    storeToRefs(verticalCarouselStore);

  const { armProgrammaticScroll } = useProgrammaticScrollWindow();

  const shouldAutoScroll = ref(true);
  // When true, the container-creation auto-scroll-to-bottom is skipped. Used
  // when switching from the native list so the carousel can navigate to the
  // history item the user was reading instead of jumping to the bottom.
  const skipInitialScroll = ref(false);
  const savedScrollTop = ref<number | null>(null);
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

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

    requestAnimationFrame(() => {
      const target = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
      if (container.scrollTop !== target) {
        armProgrammaticScroll();
      }
      container.scrollTop = container.scrollHeight;
      verticalCarouselStore.syncScrollRefs(container);
    });
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
        if (container.scrollTop !== position) {
          armProgrammaticScroll();
        }
        container.scrollTop = position;
      }
      verticalCarouselStore.syncScrollRefs(container);
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
    // images, lazy-loaded media, etc.).
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
    // the previous scroll state.
    if (current !== previous) {
      savedScrollTop.value = null;
      scrollToBottom();
      return;
    }

    if (shouldAutoScroll.value) {
      scrollToBottom();
    }
  });

  onMounted(async () => {
    await nextTick();
    scrollToBottom();
  });

  onUnmounted(() => {
    unobserveContainer();
  });

  return {
    scrollContainerRef,
    scrollToBottom,
    onScroll,
    activeSectionIndex,
    shouldAutoScroll,
    skipInitialScroll,
  };
}
