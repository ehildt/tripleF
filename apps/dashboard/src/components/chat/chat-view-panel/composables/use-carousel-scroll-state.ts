import { computed, ref, watch } from 'vue';

import { useProgrammaticScrollWindow } from '@/components/chat/chat-view-panel/composables/use-programmatic-scroll-window';

/**
 * Shared scroll state for the chat's vertical carousel. Every slide reads
 * these refs to compute its blend opacity and reset its internal scroll when
 * it becomes the active section; the carousel driver composable
 * (use-vertical-carousel) writes the live scroll metrics here.
 *
 * Module-scope singleton (rule 20): only one carousel is rendered at a time,
 * so the scroll metrics and the container handle are one shared source of
 * truth for every caller. The spec resets the refs between tests. This used
 * to be a Pinia store; it held a DOM element handle and commanded the
 * container's scrollTop, so per convention it is a composable.
 */
const scrollContainerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);

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

export function useCarouselScrollState() {
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
    if (container.scrollTop !== top) {
      useProgrammaticScrollWindow().armProgrammaticScroll();
    }
    container.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    syncScrollRefs(container);
  }

  return {
    scrollContainerRef,
    scrollTop,
    viewportHeight,
    activeSectionIndex,
    previousActiveSectionIndex,
    forceTopOnNextTransition,
    scrollToSection,
    syncScrollRefs,
  };
}
