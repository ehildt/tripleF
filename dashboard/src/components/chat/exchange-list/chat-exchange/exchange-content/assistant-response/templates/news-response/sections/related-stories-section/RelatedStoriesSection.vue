<script setup lang="ts">
import { computed } from 'vue';

import type { RelatedStory } from '@/types/harness-response-data.model';

import RelatedStoryCard from './related-story-card/RelatedStoryCard.vue';

const props = defineProps<{
  items?: RelatedStory[];
}>();

const validItems = computed(() =>
  (props.items ?? []).filter(
    (item): item is RelatedStory =>
      typeof item === 'object' &&
      item !== null &&
      (typeof (item as RelatedStory).url === 'string' ||
        typeof (item as RelatedStory).title === 'string'),
  ),
);
</script>

<template>
  <section
    v-if="validItems.length"
    class="related-stories-section"
    aria-label="Related stories"
  >
    <h3>Related Stories</h3>
    <ul
      v-if="validItems.length === 1"
      class="related-stories related-stories--single"
    >
      <RelatedStoryCard :item="validItems[0]" />
    </ul>
    <ul
      v-else
      class="related-stories"
      :class="{
        'related-stories--count-2': validItems.length === 2,
        'related-stories--count-3plus': validItems.length >= 3,
      }"
    >
      <RelatedStoryCard
        v-for="(item, index) in validItems"
        :key="index"
        :item="item"
      />
    </ul>
  </section>
</template>

<style scoped>
.related-stories-section {
  width: 100%;
}

.related-stories-section > h3 {
  margin-bottom: var(--spacing-2);
}

.related-stories-section .related-stories {
  list-style: none;
  margin: 0;
  padding: 0;
}

.related-stories-section .related-stories--single {
  display: flex;
  justify-content: center;
}

.related-stories-section .related-stories--single > :deep(li) {
  width: 75%;
  max-width: 560px;
}

.related-stories-section .related-stories--count-2,
.related-stories-section .related-stories--count-3plus {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.related-stories-section .related-stories--count-2 > :deep(li) {
  flex: 1 1 calc((100% - var(--spacing-2)) / 2);
  min-width: calc((100% - var(--spacing-2)) / 2);
}

.related-stories-section .related-stories--count-3plus > :deep(li) {
  flex: 1 1 100%;
}

@media (min-width: 640px) {
  .related-stories-section .related-stories--count-3plus > :deep(li) {
    flex: 1 1 calc((100% - var(--spacing-2)) / 2);
    min-width: calc((100% - var(--spacing-2)) / 2);
  }
}

@media (min-width: 1024px) {
  .related-stories-section .related-stories--count-3plus > :deep(li) {
    flex: 1 1 calc((100% - 2 * var(--spacing-2)) / 3);
    min-width: calc((100% - 2 * var(--spacing-2)) / 3);
  }
}
</style>
