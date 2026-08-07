<script setup lang="ts">
import type { GalleryItem } from '@/types/harness-response-data.model';

import AssistantCarousel from './carousel/AssistantCarousel.vue';
import GalleryItemComponent from './gallery-item/GalleryItem.vue';

defineProps<{
  title?: string;
  items?: GalleryItem[];
}>();
</script>

<template>
  <section
    v-if="items?.length"
    class="harness-gallery-section"
    :aria-label="$t('common.imageGallery')"
  >
    <h3 v-if="title">{{ title }}</h3>
    <ul
      v-if="items.length === 1"
      class="harness-gallery harness-gallery--single"
    >
      <GalleryItemComponent :item="items[0]" />
    </ul>
    <AssistantCarousel v-else :items="items" />
  </section>
</template>

<style scoped>
.harness-gallery-section {
  width: 100%;
}

.harness-gallery-section > h3 {
  margin-bottom: var(--spacing-2);
}

.harness-gallery {
  list-style: none;
  margin: 0;
  padding: 0;
}

.harness-gallery--single {
  display: flex;
  justify-content: center;
}

.harness-gallery--single > :deep(li) {
  width: 90%;
  height: 35rem;
}

.harness-gallery--single > :deep(li) figure {
  max-width: none;
  width: 100%;
  height: 100%;
}
</style>
