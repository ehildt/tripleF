import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

/**
 * Shared scroll state for the chat's vertical carousel. Every slide reads
 * this store to compute its blend opacity and reset its internal scroll when
 * it becomes the active section; the carousel composable writes the live
 * scroll metrics here instead of threading them through a provide/inject
 * context.
 */
export const useVerticalCarouselStore = defineStore('vertical-carousel', () => {
  const scrollContainerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);
  const viewportHeight = ref(0);
  /** True while a programmatic scroll (auto-scroll-to-bottom, snap-to-section)
   * is in flight, so callers can tell a user-initiated scroll from one the
   * composable triggered itself. */
  const isProgrammaticScroll = ref(false);
  const previousActiveSectionIndex = ref(0);
  // Set when a history click should land the target section at its top
  // regardless of scroll direction (see scrollToSection's resetToTop).
  const forceTopOnNextTransition = ref(false);

  const activeSectionIndex = computed(() => {
    if (viewportHeight.value === 0) return 0;
    return Math.round(scrollTop.value / viewportHeight.value);
  });

  watch(activeSectionIndex, (_, previous) => {
    previousActiveSectionIndex.value = previous ?? 0;
  });

  /** Mirror the container's live scroll metrics into the reactive refs the
   * slides' blend opacity reads. */
  function syncScrollRefs(container: HTMLElement) {
    scrollTop.value = container.scrollTop;
    viewportHeight.value = container.clientHeight;
  }

  /** Snap the carousel to the section at `index` (its top edge). When
   * `resetToTop` is true the target section is forced to start from its top
   * (history-click navigation) instead of the direction-based reset. */
  function scrollToSection(index: number, smooth = false, resetToTop = false) {
    const container = scrollContainerRef.value;
    if (!container) return;
    if (resetToTop) forceTopOnNextTransition.value = true;
    const top = index * container.clientHeight;
    isProgrammaticScroll.value = true;
    container.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    syncScrollRefs(container);
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

  return {
    scrollContainerRef,
    scrollTop,
    viewportHeight,
    activeSectionIndex,
    previousActiveSectionIndex,
    forceTopOnNextTransition,
    isProgrammaticScroll,
    scrollToSection,
    syncScrollRefs,
  };
});
