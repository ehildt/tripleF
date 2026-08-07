<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { GalleryItem } from '@/types/harness-response-data.model';

import GalleryItemComponent from '../gallery-item/GalleryItem.vue';

const props = defineProps<{
  items: GalleryItem[];
}>();

const trackRef = ref<HTMLElement>();
const activeIndex = ref(0);

const countClass = computed(() =>
  props.items.length === 2
    ? 'harness-carousel--count-2'
    : 'harness-carousel--count-3plus',
);

function scrollToIndex(index: number) {
  const track = trackRef.value;
  const item = track?.children[index] as HTMLElement | undefined;
  if (!track || !item) return;

  const itemCenter = item.offsetLeft + item.offsetWidth / 2;
  const target = itemCenter - track.clientWidth / 2;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  track.scrollTo({
    left: Math.max(0, Math.min(target, maxScroll)),
    behavior: 'smooth',
  });
}

function onPrev() {
  scrollToIndex(Math.max(0, activeIndex.value - 1));
}

function onNext() {
  scrollToIndex(Math.min(props.items.length - 1, activeIndex.value + 1));
}

function onDotClick(index: number) {
  scrollToIndex(index);
}

function updateActiveFromScroll() {
  const track = trackRef.value;
  if (!track || track.clientWidth === 0) return;

  const trackCenter = track.scrollLeft + track.clientWidth / 2;
  let closest = 0;
  let closestDistance = Infinity;

  Array.from(track.children).forEach((child, i) => {
    const el = child as HTMLElement;
    const center = el.offsetLeft + el.offsetWidth / 2;
    const distance = Math.abs(center - trackCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = i;
    }
  });

  activeIndex.value = closest;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  if (event.key === 'ArrowLeft') {
    onPrev();
  } else {
    onNext();
  }
}

onMounted(() => {
  updateActiveFromScroll();
});
</script>

<template>
  <div
    class="harness-carousel"
    :class="countClass"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <button
      type="button"
      class="harness-carousel__button harness-carousel__button--prev"
      :aria-label="$t('common.previousImage')"
      :disabled="activeIndex <= 0"
      @click="onPrev"
    >
      ‹
    </button>
    <ul
      ref="trackRef"
      class="harness-gallery harness-gallery--carousel"
      @scroll.passive="updateActiveFromScroll"
    >
      <GalleryItemComponent
        v-for="(item, index) in items"
        :key="index"
        :item="item"
        :class="{
          'harness-gallery__item--active': index === activeIndex,
          'harness-gallery__item--prev': index === activeIndex - 1,
          'harness-gallery__item--next': index === activeIndex + 1,
        }"
      />
    </ul>
    <button
      type="button"
      class="harness-carousel__button harness-carousel__button--next"
      :aria-label="$t('common.nextImage')"
      :disabled="activeIndex >= items.length - 1"
      @click="onNext"
    >
      ›
    </button>
    <div
      class="harness-carousel__dots"
      role="tablist"
      :aria-label="$t('common.imageNavigation')"
    >
      <button
        v-for="(_, index) in items"
        :key="index"
        type="button"
        class="harness-carousel__dot"
        :data-index="index"
        ::aria-label="$t('common.imageN', { index: index + 1 })"
        role="tab"
        :aria-selected="index === activeIndex"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="onDotClick(index)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.harness-carousel {
  position: relative;
  z-index: 0;
  width: 100%;
  min-width: 0;
  padding: var(--spacing-2) 0;
}

.harness-gallery--carousel {
  display: flex;
  gap: var(--spacing-2);
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.harness-gallery--carousel::-webkit-scrollbar {
  display: none;
}

.harness-gallery--carousel > :deep(li) {
  position: relative;
  scroll-snap-align: center;
  scroll-snap-stop: always;
  min-height: 320px;
  z-index: 1;
}

.harness-gallery--carousel > :deep(li.harness-gallery__item--active) {
  z-index: 2;
}

.harness-carousel--count-1 :deep(.harness-carousel__button),
.harness-carousel--count-1 :deep(.harness-carousel__dots) {
  display: none;
}

.harness-carousel--count-2 .harness-gallery--carousel {
  gap: 0;
  padding-inline: 25%;
  scroll-padding-inline: 25%;
}

.harness-carousel--count-2 .harness-gallery--carousel > :deep(li) {
  flex: 0 0 100%;
  min-width: 100%;
  max-width: 100%;
  min-height: 320px;
  aspect-ratio: 3 / 2;
}

.harness-carousel--count-2 :deep(.harness-gallery__item) figure {
  position: absolute;
  left: -25%;
  right: -25%;
  top: 0;
  bottom: 0;
  width: auto;
  max-width: none;
  margin: 0;
  transform: scale(0.9);
  opacity: 0.55;
  filter: brightness(0.85) grayscale(0.75) blur(2px);
  transition:
    transform 0.35s ease,
    opacity 0.35s ease,
    filter 0.35s ease;
}

.harness-carousel--count-2
  :deep(.harness-gallery__item.harness-gallery__item--active)
  figure {
  transform: scale(1.05);
  opacity: 1;
  filter: brightness(1) grayscale(0) blur(0);
}

.harness-carousel--count-2
  :deep(.harness-gallery__item.harness-gallery__item--prev)
  figure,
.harness-carousel--count-2
  :deep(.harness-gallery__item.harness-gallery__item--next)
  figure {
  transform: scale(0.9);
  opacity: 0.55;
  filter: brightness(0.85) grayscale(0.75) blur(2px);
}

.harness-carousel--count-2 :deep(.harness-gallery__trigger) {
  height: 100%;
  min-height: 260px;
  aspect-ratio: 3 / 2;
}

.harness-carousel--count-3plus .harness-gallery--carousel {
  gap: 0;
  padding-inline: 25%;
  scroll-padding-inline: 25%;
}

.harness-carousel--count-3plus .harness-gallery--carousel > :deep(li) {
  flex: 0 0 100%;
  max-width: 100%;
  min-height: 320px;
  aspect-ratio: 3 / 2;
}

.harness-carousel--count-3plus :deep(.harness-gallery__item) figure {
  position: absolute;
  left: -25%;
  right: -25%;
  top: 0;
  bottom: 0;
  width: auto;
  max-width: none;
  margin: 0;
  transform: scale(0.9);
  opacity: 0.55;
  filter: brightness(0.85) grayscale(0.75) blur(2px);
  transition:
    transform 0.35s ease,
    opacity 0.35s ease,
    filter 0.35s ease;
}

.harness-carousel--count-3plus
  :deep(.harness-gallery__item.harness-gallery__item--active)
  figure {
  transform: scale(1.05);
  opacity: 1;
  filter: brightness(1) grayscale(0) blur(0);
}

.harness-carousel--count-3plus
  :deep(.harness-gallery__item.harness-gallery__item--prev)
  figure,
.harness-carousel--count-3plus
  :deep(.harness-gallery__item.harness-gallery__item--next)
  figure {
  transform: scale(0.9);
}

.harness-carousel--count-3plus :deep(.harness-gallery__trigger) {
  height: 100%;
  min-height: 260px;
  aspect-ratio: 3 / 2;
}

.harness-carousel__button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  border: none;
  background: color-mix(in srgb, var(--color-bg-primary) 92%, transparent);
  color: var(--color-fg-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  pointer-events: auto;
  font-size: 1.25rem;
  line-height: 1;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.harness-carousel__button:hover {
  background: var(--color-bg-secondary);
}

.harness-carousel__button:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.harness-carousel__button:disabled {
  opacity: 0.3;
  cursor: default;
}

.harness-carousel__button--prev {
  left: 2.5rem;
}

.harness-carousel__button--next {
  right: 2.5rem;
}

.harness-carousel__dots {
  display: flex;
  justify-content: center;
  gap: var(--spacing-1);
  margin-top: var(--spacing-2);
}

.harness-carousel__dot {
  width: 0.5rem;
  height: 0.5rem;
  border: 0;
  background: var(--color-fg-muted);
  opacity: 0.4;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.harness-carousel__dot[aria-selected='true'] {
  opacity: 1;
  transform: scale(1.25);
  background: var(--color-accent-primary);
}
</style>
