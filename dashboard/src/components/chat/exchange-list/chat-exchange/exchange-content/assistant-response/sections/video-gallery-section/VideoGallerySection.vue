<script setup lang="ts">
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import VideoGalleryItemComponent from './video-gallery-item/VideoGalleryItem.vue';

defineProps<{
  title?: string;
  items?: VideoGalleryItem[];
}>();
</script>

<template>
  <section
    v-if="items?.length"
    class="video-gallery-section"
    aria-label="Video gallery"
  >
    <h3 v-if="title">{{ title }}</h3>
    <ul v-if="items.length === 1" class="video-gallery video-gallery--single">
      <VideoGalleryItemComponent :item="items[0]" />
    </ul>
    <ul v-else class="video-gallery video-gallery--grid">
      <VideoGalleryItemComponent
        v-for="(item, index) in items"
        :key="index"
        :item="item"
      />
    </ul>
  </section>
</template>

<style scoped>
.video-gallery-section {
  width: 100%;
}

.video-gallery-section > h3 {
  margin-bottom: var(--spacing-2);
}

.video-gallery {
  list-style: none;
  margin: 0;
  padding: 0;
}

.video-gallery--single {
  display: flex;
  justify-content: center;
}

.video-gallery--single > :deep(li) {
  width: 100%;
  max-width: 560px;
}

.video-gallery--grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2);
}

@media (min-width: 640px) {
  .video-gallery--grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .video-gallery--grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
