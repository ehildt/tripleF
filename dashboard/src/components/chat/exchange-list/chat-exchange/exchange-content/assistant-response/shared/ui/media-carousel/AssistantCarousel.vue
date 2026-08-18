<script setup lang="ts">
import { computed, ref } from 'vue';

import { activePlaybackVideoUrl } from '../../../composables/video-playback.state';
import { isVideoMediaItem } from '../../helpers/is-video-media-item.helper';
import CarouselContent from './carousel-content/CarouselContent.vue';
import CarouselHeader from './carousel-header/CarouselHeader.vue';
import { useCarouselNavigation } from './composables/use-carousel-navigation.composable';
import type { AssistantCarouselProps } from './AssistantCarousel.types';

const props = defineProps<AssistantCarouselProps>();

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
</script>

<template>
  <div class="harness-carousel" tabindex="0" @keydown="onKeyDown">
    <CarouselHeader
      :active-index="activeIndex"
      :count="items.length"
      :playing-index="playingIndex"
      :title="title"
      :title-id="titleId"
      @select="scrollToIndex"
    />
    <CarouselContent
      ref="contentRef"
      :items="items"
      :active-index="activeIndex"
      @scroll="onScroll"
      @prev="onPrev"
      @next="onNext"
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
