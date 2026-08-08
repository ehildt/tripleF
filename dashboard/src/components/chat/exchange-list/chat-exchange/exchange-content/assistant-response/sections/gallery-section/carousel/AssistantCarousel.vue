<script setup lang="ts">
import { computed, ref } from 'vue';

import CarouselContent from './carousel-content/CarouselContent.vue';
import CarouselHeader from './carousel-header/CarouselHeader.vue';
import { useCarouselNavigation } from './composables/use-carousel-navigation.composable';
import type { AssistantCarouselProps } from './AssistantCarousel.types';

const props = defineProps<AssistantCarouselProps>();

/** The track lives in CarouselContent; its ref is forwarded for scrolling. */
const contentRef = ref<InstanceType<typeof CarouselContent> | null>(null);
const trackRef = computed(() => contentRef.value?.trackRef ?? null);

const { activeIndex, onScroll, onPrev, onNext, onKeyDown, scrollToIndex } =
  useCarouselNavigation(trackRef, () => props.items.length);
</script>

<template>
  <div class="harness-carousel" tabindex="0" @keydown="onKeyDown">
    <CarouselHeader
      :active-index="activeIndex"
      :count="items.length"
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
