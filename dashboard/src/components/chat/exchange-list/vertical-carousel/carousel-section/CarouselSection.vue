<script setup lang="ts">
import ChatExchange from '../../chat-exchange/ChatExchange.vue';
import { useCarouselSection } from './composables/use-carousel-section.composable';
import type { CarouselSectionProps } from './CarouselSection.types';

const props = defineProps<CarouselSectionProps>();

const emit = defineEmits<{
  delete: [exchangeId: string];
  retry: [exchangeId: string];
  branch: [exchangeId: string];
  toggleIncluded: [exchangeId: string];
  hoverDeleteStart: [exchangeId: string];
  hoverDeleteEnd: [];
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
      @delete="emit('delete', $event)"
      @retry="emit('retry', $event)"
      @branch="emit('branch', $event)"
      @toggle-included="emit('toggleIncluded', $event)"
      @hover-delete-start="emit('hoverDeleteStart', $event)"
      @hover-delete-end="emit('hoverDeleteEnd')"
    />
    <ChatExchange
      v-for="assistant in section.assistants"
      :key="assistant.id"
      :exchange="assistant"
      :highlighted="highlightedIds.has(assistant.id)"
      :collapsed="collapsedIds.has(assistant.id)"
      @delete="emit('delete', $event)"
      @retry="emit('retry', $event)"
      @branch="emit('branch', $event)"
      @toggle-included="emit('toggleIncluded', $event)"
      @hover-delete-start="emit('hoverDeleteStart', $event)"
      @hover-delete-end="emit('hoverDeleteEnd')"
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
