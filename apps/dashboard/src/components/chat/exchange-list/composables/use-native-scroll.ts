import {
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';

const SCROLL_BOTTOM_THRESHOLD_PX = 8;

/**
 * Drive the native continuous-scroll variant of the exchange list. Unlike the
 * vertical carousel there are no full-height slides, snap, or crossfade —
 * sections are variable-height blocks in a normal scroll container. This
 * composable owns the auto-scroll-to-bottom behavior (follow the stream while
 * the user is at the bottom), the active-section highlight, and
 * `scrollToSection` for history-click navigation.
 */
export function useNativeScroll() {
  const scrollContainerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);
  const shouldAutoScroll = ref(true);
  const activeSectionIndex = ref(0);
  // True while a programmatic scroll (auto-scroll-to-bottom, scroll-to-section)
  // is in flight, so callers can tell a user-initiated scroll from one the
  // composable triggered itself.
  const isProgrammaticScroll = ref(false);
  // When true, the container-creation auto-scroll-to-bottom is skipped. Used
  // when switching from the carousel so the native list can restore the
  // section the user was reading instead of jumping to the bottom.
  const skipInitialScroll = ref(false);
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
    isProgrammaticScroll.value = true;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      isProgrammaticScroll.value = false;
    });
  }

  /** Scroll the section at `index` to the top of the container. */
  function scrollToSection(index: number, smooth = false) {
    const container = getContainer();
    if (!container) return;
    const section = container.querySelector(`[data-section-index="${index}"]`);
    if (!section) return;
    // Navigating to a specific section is a deliberate scroll-away from the
    // bottom: stop following the stream so a later resize/mutation does not
    // yank the view back down.
    shouldAutoScroll.value = false;
    isProgrammaticScroll.value = true;
    container.scrollTo({
      top: (section as HTMLElement).offsetTop,
      behavior: smooth ? 'smooth' : 'auto',
    });
    if (smooth) {
      window.setTimeout(() => {
        isProgrammaticScroll.value = false;
      }, 400);
    } else {
      isProgrammaticScroll.value = false;
    }
  }

  /** The section whose top is nearest the container's scroll position. */
  function updateActiveSection(container: HTMLElement) {
    const sections = Array.from(
      container.querySelectorAll('[data-section-index]'),
    );
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < sections.length; i++) {
      const distance = Math.abs(
        (sections[i] as HTMLElement).offsetTop - container.scrollTop,
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    activeSectionIndex.value = best;
  }

  function onScroll() {
    const container = getContainer();
    if (!container) return;
    scrollTop.value = container.scrollTop;
    shouldAutoScroll.value = isAtBottom(container);
    updateActiveSection(container);
  }

  function keepAtBottomIfNeeded() {
    const container = getContainer();
    if (!container) return;
    // A pending mode-switch restore owns the scroll position until it
    // navigates; an auto-bottom queued here would stomp it.
    if (skipInitialScroll.value) return;
    if (shouldAutoScroll.value) {
      scrollToBottom();
    }
  }

  // Thinking text streams into the exchange-activity element and has its own
  // internal autoscroll — it must not pull the whole exchange list along.
  function isActivityMutation(mutation: MutationRecord): boolean {
    const target = mutation.target;
    const element = target instanceof Element ? target : target.parentElement;
    return element?.closest('[data-exchange-activity]') != null;
  }

  function observeContainer(container: HTMLElement) {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
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
