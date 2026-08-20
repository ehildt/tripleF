<script setup lang="ts">
import { type ComponentPublicInstance, computed, toRef, watch } from 'vue';

import { useNativeScroll } from '../composables/use-native-scroll';
import { useVerticalCarousel } from '../composables/use-vertical-carousel';
import ExchangeEmptyState from '../exchange-empty-state/ExchangeEmptyState.vue';
import CarouselSection from '../vertical-carousel/carousel-section/CarouselSection.vue';
import type { ScrollableExchangeListProps } from './ScrollableExchangeList.types';

const props = defineProps<ScrollableExchangeListProps>();

const emit = defineEmits<{
  retry: [exchangeId: string];
  /** Fired on a user-initiated scroll (not a programmatic auto-scroll). */
  scroll: [];
}>();

const isCarousel = computed(() => props.mode === 'carousel');

// Both composables are called unconditionally (Vue composables must be), but
// only the container for the active mode is rendered, so the other one's ref
// stays null and its observers never attach.
const {
  scrollContainerRef,
  scrollToSection,
  onScroll,
  activeSectionIndex,
  isProgrammaticScroll,
  shouldAutoScroll: carouselShouldAutoScroll,
  skipInitialScroll: skipCarouselInitialScroll,
} = useVerticalCarousel(
  toRef(props, 'isCompact'),
  toRef(props, 'activeAssistantExchangeId'),
  toRef(props, 'activeAssistantResponseStarted'),
);

const native = useNativeScroll();

const activeSectionIndexForMode = computed(() =>
  isCarousel.value ? activeSectionIndex.value : native.activeSectionIndex.value,
);

// When switching scroll modes, keep the user on the history item they were
// reading — the one highlighted in the right-panel history. flush:'sync' makes
// this run synchronously on the prop change, *before* the render effect
// patches the DOM: the freshly mounted container's own mount watch (which
// would otherwise queue an auto-scroll-to-bottom) must already see the skip
// flag. The tracked exchange is then navigated to exactly like a history
// click does.
let stopRestore: (() => void) | null = null;

watch(
  () => props.mode,
  (mode, previousMode) => {
    stopRestore?.();
    stopRestore = null;
    // Clear any stale skip from an interrupted switch before evaluating below.
    skipCarouselInitialScroll.value = false;
    native.skipInitialScroll.value = false;

    const sourceIndex =
      previousMode === 'carousel'
        ? activeSectionIndex.value
        : native.activeSectionIndex.value;

    const targetId = props.sections[sourceIndex]?.user?.id ?? null;
    if (targetId === null) return;

    // Freeze the target mode's auto-scroll before its container mounts: no
    // auto-bottom may queue while the restore navigation is pending.
    if (mode === 'carousel') {
      skipCarouselInitialScroll.value = true;
      carouselShouldAutoScroll.value = false;
    } else {
      native.skipInitialScroll.value = true;
      native.shouldAutoScroll.value = false;
    }
    const targetSkip =
      mode === 'carousel'
        ? skipCarouselInitialScroll
        : native.skipInitialScroll;
    // The target container mounts in the upcoming render. Wait until it is
    // present before navigating; until then the container-creation
    // auto-scroll-to-bottom is suppressed via the flags above.
    const targetContainerRef =
      mode === 'carousel' ? scrollContainerRef : native.scrollContainerRef;
    stopRestore = watch(
      () => targetContainerRef.value,
      (container) => {
        if (!container) return;
        stopRestore?.();
        stopRestore = null;
        scrollToExchange(targetId);
        // Clear the skip only after this whole flush (and every mount-time
        // watcher in it) has settled — this restore watch may run *before*
        // the target composable's own container watch, so clearing right
        // here would let that watch queue an auto-scroll-to-bottom that
        // stomps this navigation on the next animation frame.
        window.setTimeout(() => {
          targetSkip.value = false;
        }, 0);
      },
      { immediate: true },
    );
  },
  { flush: 'sync' },
);

const activeUserExchangeId = computed(
  () => props.sections[activeSectionIndexForMode.value]?.user?.id ?? null,
);

// When a section is deleted the carousel's scroll offset is left orphaned:
// the DOM clamps `scrollTop` (or the ref is stale past the trimmed track),
// so `activeSectionIndex` points at a slot that no longer exists and the
// blend leaves every slide at opacity 0 — a blank view with no way to scroll
// back into a section. Re-snap to the section that slid into the gap (the
// next section, same index) or, when none exists (deleted at the end), to
// the previous section. Native mode is a continuous list and has no such
// snap/orphan problem.
watch(
  () => props.sections.length,
  (newLength, previousLength) => {
    if (!isCarousel.value) return;
    if (newLength >= previousLength || newLength === 0) return;
    const targetIndex = Math.min(activeSectionIndex.value, newLength - 1);
    if (targetIndex < 0) return;
    scrollToSection(targetIndex);
  },
);

function setScrollContainer(el: Element | ComponentPublicInstance | null) {
  scrollContainerRef.value = el instanceof HTMLElement ? el : null;
}

function setNativeScrollContainer(
  el: Element | ComponentPublicInstance | null,
) {
  native.scrollContainerRef.value = el instanceof HTMLElement ? el : null;
}

function onCarouselScroll() {
  onScroll();
  if (!isProgrammaticScroll.value) emit('scroll');
}

function onNativeScroll() {
  native.onScroll();
  if (!native.isProgrammaticScroll.value) emit('scroll');
}

function scrollToExchange(exchangeId: string) {
  const index = props.sections.findIndex(
    (section) =>
      section.user?.id === exchangeId ||
      section.assistants.some((assistant) => assistant.id === exchangeId),
  );
  if (index < 0) return;

  if (isCarousel.value) {
    scrollToSection(index, true, true);
    // A history click always lands the section at its top. Reset it directly
    // too, so clicking the already-active section still scrolls it to the top
    // (the activation watch only fires when the active section changes).
    const section = props.sections[index];
    scrollContainerRef.value
      ?.querySelector(`[data-section-id="${section.id}"]`)
      ?.scrollTo({ top: 0 });
  } else {
    native.scrollToSection(index, true);
  }
}

defineExpose({ scrollToExchange, activeUserExchangeId });
</script>

<template>
  <div
    v-if="isCarousel"
    :ref="setScrollContainer"
    class="vertical-carousel"
    data-playback-scroll-root
    @scroll="onCarouselScroll"
  >
    <Transition name="exchange-list-state" mode="out-in">
      <ExchangeEmptyState v-if="sections.length === 0" key="empty" />
      <div v-else key="sections" class="vertical-carousel__track">
        <CarouselSection
          v-for="(section, index) in sections"
          :key="section.id"
          :section="section"
          :index="index"
          mode="carousel"
          :highlighted-ids="highlightedIds"
          :collapsed-ids="collapsedIds"
          @retry="emit('retry', $event)"
        />
      </div>
    </Transition>
  </div>

  <div
    v-else
    :ref="setNativeScrollContainer"
    class="native-scroll"
    data-playback-scroll-root
    @scroll="onNativeScroll"
  >
    <ExchangeEmptyState v-if="sections.length === 0" />
    <div v-else class="native-scroll__list">
      <CarouselSection
        v-for="(section, index) in sections"
        :key="section.id"
        :section="section"
        :index="index"
        mode="native"
        :highlighted-ids="highlightedIds"
        :collapsed-ids="collapsedIds"
        @retry="emit('retry', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.vertical-carousel {
  position: relative;
  height: calc(100vh - 12rem);
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  /* The carousel is a full-page carousel, not a scroll list: hide its own
     scrollbar. The right-panel history highlights the active section instead. */
  scrollbar-width: none;
}

.vertical-carousel::-webkit-scrollbar {
  display: none;
}

.vertical-carousel__track {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Native mode: a normal scrollable list with its own scrollbar. */
.native-scroll {
  position: relative;
  height: calc(100vh - 12rem);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.native-scroll__list {
  display: flex;
  flex-direction: column;
}

.exchange-list-state-enter-active,
.exchange-list-state-leave-active {
  transition: opacity 200ms ease;
}

.exchange-list-state-enter-from,
.exchange-list-state-leave-to {
  opacity: 0;
}
</style>
