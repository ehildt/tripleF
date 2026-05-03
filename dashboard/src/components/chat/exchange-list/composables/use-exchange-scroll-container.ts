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
 */
export function useExchangeScrollContainer(
  isCompact: Ref<boolean>,
  activeAssistantExchangeId: Ref<string | null>,
  scrollContainerRef: Ref<HTMLElement | null>,
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

  function observeContainer(container: HTMLElement) {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => keepAtBottomIfNeeded());
      resizeObserver.observe(container);
    }

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => keepAtBottomIfNeeded());
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

  watch(activeAssistantExchangeId, (current, previous) => {
    if (current === null) {
      if (previous !== null && savedScrollTop.value !== null) {
        restoreSavedScrollPosition();
      }
      return;
    }

    if (previous === null && savedScrollTop.value === null) {
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
