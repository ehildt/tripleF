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
    <ul v-else class="related-stories related-stories--grid">
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
  width: 100%;
  max-width: 560px;
}

.related-stories-section .related-stories--grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2);
}

@media (min-width: 640px) {
  .related-stories-section .related-stories--grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .related-stories-section .related-stories--grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
