<script setup lang="ts">
import { computed, ref } from 'vue';

import type { MediaItem } from '@/types/harness-response-data.model';

import { activePlaybackVideoUrl } from '../../../composables/video-playback.state';
import { isVideoMediaItem } from '../../helpers/is-video-media-item.helper';
import CarouselContent from './carousel-content/CarouselContent.vue';
import CarouselHeader from './carousel-header/CarouselHeader.vue';
import { useCarouselNavigation } from './composables/use-carousel-navigation.composable';
import type { AssistantCarouselProps } from './AssistantCarousel.types';

const props = defineProps<AssistantCarouselProps>();

const emit = defineEmits<{ remove: [item: MediaItem] }>();

/** The track lives in CarouselContent; its ref is forwarded for scrolling. */
const contentRef = ref<InstanceType<typeof CarouselContent> | null>(null);
const trackRef = computed(() => contentRef.value?.trackRef ?? null);

/**
 * Index of the slide whose video is currently playing (the app-level
 * playback highlight). -1 when nothing in this carousel is playing.
 */
const playingIndex = computed(() => {
  const url = activePlaybackVideoUrl.value;
  if (!url) return -1;
  return props.items.findIndex(
    (item) => isVideoMediaItem(item) && item.videoUrl === url,
  );
});

const { activeIndex, onScroll, onPrev, onNext, onKeyDown, scrollToIndex } =
  useCarouselNavigation(
    trackRef,
    () => props.items.length,
    // Land on the currently playing video when the gallery opens.
    Math.max(0, playingIndex.value),
  );

/** Slide titles for the dot tooltips; undefined slots get no tooltip. */
const itemTitles = computed(() => props.items.map((item) => item.title));
</script>

<template>
  <div class="harness-carousel" tabindex="0" @keydown="onKeyDown">
    <CarouselHeader
      :active-index="activeIndex"
      :count="items.length"
      :playing-index="playingIndex"
      :title="title"
      :title-id="titleId"
      :item-titles="itemTitles"
      @select="scrollToIndex"
    />
    <CarouselContent
      ref="contentRef"
      :items="items"
      :active-index="activeIndex"
      :removable="removable"
      @scroll="onScroll"
      @prev="onPrev"
      @next="onNext"
      @remove="emit('remove', $event)"
    />
  </div>
</template>

<style scoped>
.harness-carousel {
  width: 100%;
  min-width: 0;
  padding: var(--spacing-2) 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
