import {
  type ComponentPublicInstance,
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  watch,
} from 'vue';

import { useCarouselBlend } from '../../../composables/use-carousel-blend';
import { CAROUSEL_SCROLL_STATE } from '../../../composables/use-vertical-carousel';
import type { CarouselSectionProps } from '../CarouselSection.types';

/**
 * Owns the carousel-section behavior: the blend opacity for the slide, the
 * wheel hand-off to the carousel at the section's scroll edges, and the
 * scroll reset on each section transition.
 */
export function useCarouselSection(props: CarouselSectionProps) {
  const sectionElement = ref<HTMLElement | null>(null);
  const isCarousel = computed(() => props.mode === 'carousel');

  // The carousel state is only provided in carousel mode; in native mode the
  // fallbacks keep the blend at full opacity and the carousel behaviors inert.
  const carousel = inject(CAROUSEL_SCROLL_STATE, null);
  const scrollTop = computed(() => carousel?.scrollTop.value ?? 0);
  const viewportHeight = computed(() => carousel?.viewportHeight.value ?? 0);
  const activeSectionIndex = computed(
    () => carousel?.activeSectionIndex.value ?? -1,
  );
  const previousActiveSectionIndex = computed(
    () => carousel?.previousActiveSectionIndex.value ?? 0,
  );
  const scrollToSection = carousel?.scrollToSection ?? (() => {});

  const { opacity: blendOpacity } = useCarouselBlend(
    toRef(props, 'index'),
    scrollTop,
    viewportHeight,
  );
  // The blend only applies to carousel slides. In native mode the carousel
  // state is still provided (useVerticalCarousel is called unconditionally), so
  // force full opacity here rather than inheriting a stale blend value.
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
    if (carousel?.forceTopOnNextTransition.value) {
      carousel.forceTopOnNextTransition.value = false;
      el.scrollTo({ top: 0 });
    } else if (active > previousActiveSectionIndex.value) {
      el.scrollTo({ top: 0 });
    } else {
      el.scrollTo({ top: el.scrollHeight });
    }
  });

  return { opacity, setSectionElement };
}
