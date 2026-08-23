<script setup lang="ts">
import ChatExchange from '../../chat-exchange/ChatExchange.vue';
import { useCarouselSection } from './composables/use-carousel-section.composable';
import type { CarouselSectionProps } from './CarouselSection.types';

const props = defineProps<CarouselSectionProps>();

const emit = defineEmits<{
  retry: [exchangeId: string];
}>();

const { opacity, setSectionElement } = useCarouselSection(props);
</script>

<template>
  <div
    :ref="setSectionElement"
    :data-section-id="section.id"
    :data-section-index="index"
    class="carousel-section"
    :class="{ 'carousel-section--native': mode === 'native' }"
    :style="{ opacity }"
  >
    <ChatExchange
      v-if="section.user"
      :exchange="section.user"
      :highlighted="highlightedIds.has(section.user.id)"
      :collapsed="collapsedIds.has(section.user.id)"
      @retry="emit('retry', $event)"
    />
    <ChatExchange
      v-for="assistant in section.assistants"
      :key="assistant.id"
      :exchange="assistant"
      :highlighted="highlightedIds.has(assistant.id)"
      :collapsed="collapsedIds.has(assistant.id)"
      @retry="emit('retry', $event)"
    />
  </div>
</template>

<style scoped>
.carousel-section {
  height: 100%;
  flex-shrink: 0;
  scroll-snap-align: start;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-2);
}

/* Native mode: a variable-height block in the continuous scroll list — no
   full-height slide, no snap, no internal scroll. */
.carousel-section--native {
  height: auto;
  scroll-snap-align: none;
  overflow-y: visible;
}
</style>
