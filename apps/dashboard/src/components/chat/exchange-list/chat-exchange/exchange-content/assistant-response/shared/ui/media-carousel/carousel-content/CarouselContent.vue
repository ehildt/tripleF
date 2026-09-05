<script setup lang="ts">
import { computed, ref } from 'vue';

import type { MediaItem } from '@/types/harness-response-data.model';

import { isVideoMediaItem } from '../../../helpers/is-video-media-item.helper';
import GalleryItemComponent from '../gallery-item/GalleryItem.vue';
import VideoCarouselItem from '../video-carousel-item/VideoCarouselItem.vue';
import type { CarouselContentProps } from './CarouselContent.types';

const props = defineProps<CarouselContentProps>();
const emit = defineEmits<{
  scroll: [];
  prev: [];
  next: [];
  remove: [item: MediaItem];
}>();

/** The scroll track, exposed so the orchestrator can drive it programmatically. */
const trackRef = ref<HTMLElement>();
defineExpose({ trackRef });

const countClass = computed(() =>
  props.items.length === 2
    ? 'carousel-content--count-2'
    : 'carousel-content--count-3plus',
);
</script>

<template>
  <div class="carousel-content" :class="countClass">
    <button
      type="button"
      class="carousel-content__button carousel-content__button--prev"
      :aria-label="$t('common.previousImage')"
      :disabled="activeIndex <= 0"
      @click="emit('prev')"
    >
      ‹
    </button>
    <ul
      ref="trackRef"
      class="harness-gallery harness-gallery--carousel"
      @scroll.passive="emit('scroll')"
    >
      <template v-for="(item, index) in items" :key="index">
        <GalleryItemComponent
          v-if="!isVideoMediaItem(item)"
          :item="item"
          :removable="removable"
          :class="{
            'harness-gallery__item--active': index === activeIndex,
            'harness-gallery__item--prev': index === activeIndex - 1,
            'harness-gallery__item--next': index === activeIndex + 1,
          }"
          @remove="emit('remove', item)"
        />
        <VideoCarouselItem
          v-else
          :item="item"
          :active="index === activeIndex"
          :class="{
            'video-carousel-item--active': index === activeIndex,
            'video-carousel-item--prev': index === activeIndex - 1,
            'video-carousel-item--next': index === activeIndex + 1,
          }"
        />
      </template>
    </ul>
    <button
      type="button"
      class="carousel-content__button carousel-content__button--next"
      :aria-label="$t('common.nextImage')"
      :disabled="activeIndex >= items.length - 1"
      @click="emit('next')"
    >
      ›
    </button>
  </div>
</template>

<style scoped>
.carousel-content {
  position: relative;

  /* The peek/dim values for side slides, shared with VideoCarouselItem so
     image and video slides stay visually identical. */
  --carousel-peek-transform: scale(0.9);
  --carousel-peek-opacity: 0.55;
  --carousel-peek-filter: brightness(0.85) grayscale(0.75) blur(2px);
  --carousel-active-transform: scale(1);
  --carousel-active-opacity: 1;
  --carousel-active-filter: brightness(1) grayscale(0) blur(0);
}

/* -------- scroll track (shared harness-gallery block) -------- */

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
  min-height: 360px;
  z-index: 1;
}

.harness-gallery--carousel > :deep(li.harness-gallery__item--active) {
  z-index: 2;
}

.harness-gallery--carousel > :deep(li.video-carousel-item--active) {
  z-index: 2;
}

/* -------- overlay prev/next buttons -------- */

.carousel-content__button {
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

.carousel-content__button:hover {
  background: var(--color-bg-tertiary);
}

.carousel-content__button:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.carousel-content__button:disabled {
  opacity: 0.3;
  cursor: default;
}

.carousel-content__button--prev {
  left: 2.5rem;
}

.carousel-content__button--next {
  right: 2.5rem;
}

/* -------- slide geometry: peek layout shared by both count variants
   (2 slides and 3+); count-2 only forces a min-width on its slides -------- */

.carousel-content .harness-gallery--carousel {
  gap: 0;
  padding-inline: 25%;
  scroll-padding-inline: 25%;
}

.carousel-content .harness-gallery--carousel > :deep(li) {
  flex: 0 0 100%;
  max-width: 100%;
  min-height: 360px;
  aspect-ratio: 3 / 2;
}

.carousel-content--count-2 .harness-gallery--carousel > :deep(li) {
  min-width: 100%;
}

/* Side slides shrink into dimmed peeks; the centered slide is bright and
   full size. Values come from the shared --carousel-* tokens, also used by
   VideoCarouselItem, so image and video slides stay visually identical. */

.carousel-content :deep(.harness-gallery__item) figure {
  position: absolute;
  left: -25%;
  right: -25%;
  top: 0;
  bottom: 0;
  width: auto;
  max-width: none;
  margin: 0;
  transform: var(--carousel-peek-transform);
  opacity: var(--carousel-peek-opacity);
  filter: var(--carousel-peek-filter);
  transition:
    transform 0.35s ease,
    opacity 0.35s ease,
    filter 0.35s ease;
}

.carousel-content
  :deep(.harness-gallery__item.harness-gallery__item--active)
  figure {
  transform: var(--carousel-active-transform);
  opacity: var(--carousel-active-opacity);
  filter: var(--carousel-active-filter);
}

.carousel-content
  :deep(.harness-gallery__item.harness-gallery__item--prev)
  figure,
.carousel-content
  :deep(.harness-gallery__item.harness-gallery__item--next)
  figure {
  transform: var(--carousel-peek-transform);
  opacity: var(--carousel-peek-opacity);
  filter: var(--carousel-peek-filter);
}

.carousel-content :deep(.harness-gallery__trigger) {
  height: 100%;
  min-height: 260px;
  aspect-ratio: 3 / 2;
}
</style>
