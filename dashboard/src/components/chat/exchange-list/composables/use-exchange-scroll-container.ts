import {
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
  watch,
} from 'vue';

const SCROLL_BOTTOM_THRESHOLD_PX = 8;

/**
 * Drive a scrollable container that auto-scrolls to the bottom on new
 * content unless the user has manually scrolled away during an assistant
 * response.
 *
 * `scrollContainerRef` is the orchestrator-owned ref bound to the
 * scrollable element via the child's `setScrollContainer` emit. Returns
 * `scrollToBottom`, `scrollToExchange`, and `onScroll` helpers.
 *
 * `activeAssistantResponseStarted` releases the bottom pin: once the first
 * response content arrives, the view stops chasing the growing tail so the
 * user can start reading from the top of the response.
 */
export function useExchangeScrollContainer(
  isCompact: Ref<boolean>,
  activeAssistantExchangeId: Ref<string | null>,
  scrollContainerRef: Ref<HTMLElement | null>,
  activeAssistantResponseStarted: Ref<boolean>,
) {
  const shouldAutoScroll = ref(true);
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
      container.scrollTop = container.scrollHeight;
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
        container.scrollTop = position;
      }
      savedScrollTop.value = null;
    });
  }

  function scrollToExchange(exchangeId: string) {
    const container = getContainer();
    if (!container) return;
    const el = container.querySelector(`[data-exchange-id="${exchangeId}"]`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }

  function onScroll() {
    const container = getContainer();
    if (!container) return;

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
      resizeObserver = new ResizeObserver(() => keepAtBottomIfNeeded());
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
        scrollToBottom();
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
  }

  return {
    scrollToBottom,
    scrollToExchange,
    onScroll,
  };
}
