import {
  type ComponentPublicInstance,
  computed,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  watch,
} from 'vue';

import { useVerticalCarouselStore } from '@/stores/vertical-carousel';

import { useCarouselBlend } from '../../../composables/use-carousel-blend';
import type { CarouselSectionProps } from '../CarouselSection.types';

/**
 * Owns the carousel-section behavior: the blend opacity for the slide, the
 * wheel hand-off to the carousel at the section's scroll edges, and the
 * scroll reset on each section transition. Reads the shared scroll state from
 * the vertical-carousel store.
 */
export function useCarouselSection(props: CarouselSectionProps) {
  const sectionElement = ref<HTMLElement | null>(null);
  const isCarousel = computed(() => props.mode === 'carousel');

  const carouselStore = useVerticalCarouselStore();
  const scrollTop = computed(() => carouselStore.scrollTop);
  const viewportHeight = computed(() => carouselStore.viewportHeight);
  const activeSectionIndex = computed(() => carouselStore.activeSectionIndex);
  const previousActiveSectionIndex = computed(
    () => carouselStore.previousActiveSectionIndex,
  );
  const scrollToSection = carouselStore.scrollToSection;

  const { opacity: blendOpacity } = useCarouselBlend(toRef(props, 'index'));
  // The blend only applies to carousel slides. In native mode the carousel
  // state is still written (useVerticalCarousel is called unconditionally),
  // so force full opacity here rather than inheriting a stale blend value.
  const opacity = computed(() => (isCarousel.value ? blendOpacity.value : 1));

  function setSectionElement(el: Element | ComponentPublicInstance | null) {
    sectionElement.value = el instanceof HTMLElement ? el : null;
  }

  // When the user scrolls this section to its top/bottom and keeps scrolling,
  // hand the gesture to the carousel so the next/previous section transitions
  // in. Only fires while this section is the active one and the carousel is
  // settled on it, so a transition in progress is never re-triggered.
  function onWheel(event: WheelEvent) {
    if (!isCarousel.value) return;
    const el = sectionElement.value;
    if (!el) return;
    if (activeSectionIndex.value !== props.index) return;
    const settled =
      Math.abs(scrollTop.value - props.index * viewportHeight.value) < 2;
    if (!settled) return;

    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    const delta = event.deltaY;

    if (delta > 0 && atBottom) {
      event.preventDefault();
      scrollToSection(props.index + 1, true);
    } else if (delta < 0 && atTop) {
      event.preventDefault();
      scrollToSection(props.index - 1, true);
    }
  }

  onMounted(() => {
    sectionElement.value?.addEventListener('wheel', onWheel, {
      passive: false,
    });
  });

  onUnmounted(() => {
    sectionElement.value?.removeEventListener('wheel', onWheel);
  });

  // On each section transition, reset this slide's internal scroll so the
  // newly-active section starts where the user expects: from the top when they
  // scrolled down into it, or from the bottom when they scrolled up into it. A
  // history-click navigation forces the top regardless of direction.
  watch(activeSectionIndex, (active) => {
    if (!isCarousel.value) return;
    if (active !== props.index) return;
    const el = sectionElement.value;
    if (!el) return;
    if (carouselStore.forceTopOnNextTransition) {
      carouselStore.forceTopOnNextTransition = false;
      el.scrollTo({ top: 0 });
    } else if (active > previousActiveSectionIndex.value) {
      el.scrollTo({ top: 0 });
    } else {
      el.scrollTo({ top: el.scrollHeight });
    }
  });

  return { opacity, setSectionElement };
}
