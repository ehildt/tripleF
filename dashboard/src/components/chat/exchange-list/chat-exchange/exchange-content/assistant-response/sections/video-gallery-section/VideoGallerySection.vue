<script setup lang="ts">
import { computed } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import VideoGalleryItemComponent from './video-gallery-item/VideoGalleryItem.vue';

const props = defineProps<{
  title?: string;
  items?: VideoGalleryItem[];
  /** Optional fixed column count (e.g. 3 review videos in a row). When set,
   *  overrides the responsive count-based layout. */
  columns?: number;
}>();

const count = computed(() => props.items?.length ?? 0);

const columnsClass = computed(() =>
  props.columns ? `video-gallery--columns-${props.columns}` : '',
);
</script>

<template>
  <section
    v-if="items?.length"
    class="video-gallery-section"
    aria-label="Video gallery"
  >
    <h3 v-if="title">{{ title }}</h3>
    <ul
      v-if="items.length"
      class="video-gallery"
      :class="[
        columnsClass
          ? columnsClass
          : {
              'video-gallery--count-1': count === 1,
              'video-gallery--count-2': count === 2,
              'video-gallery--count-3-plus': count >= 3,
            },
      ]"
    >
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-2);
}

.video-gallery > :deep(li) {
  display: flex;
  justify-content: center;
}

/* 1 item: full-width, centered. */
.video-gallery--count-1 > :deep(li) {
  width: 100%;
  flex: 0 0 85%;
}

/* 2 items: 2 equal columns. */
.video-gallery--count-2 > :deep(li) {
  flex: 1 1 calc((100% - var(--spacing-2)) / 2);
  min-width: calc((100% - var(--spacing-2)) / 2);
}

/* 3+ items: single column on small screens. */
.video-gallery--count-3-plus > :deep(li) {
  width: 100%;
  flex: 0 0 100%;
}

@media (min-width: 640px) {
  /* 3+ items: 2 columns. */
  .video-gallery--count-3-plus > :deep(li) {
    flex: 1 1 calc((100% - var(--spacing-2)) / 2);
    min-width: calc((100% - var(--spacing-2)) / 2);
  }

  /* Odd total count: the lone last-row item spans the full row. */
  .video-gallery--count-3-plus > :deep(li:nth-child(2n + 1):last-child) {
    width: 100%;
    flex: 0 0 100%;
  }
}

@media (min-width: 1024px) {
  /* 3+ items: 3 columns. */
  .video-gallery--count-3-plus > :deep(li) {
    flex: 1 1 calc((100% - 2 * var(--spacing-2)) / 3);
    min-width: calc((100% - 2 * var(--spacing-2)) / 3);
  }

  /* 2 items left in the last row → share the row equally. */
  .video-gallery--count-3-plus > :deep(li:nth-last-child(2):nth-child(3n + 1)),
  .video-gallery--count-3-plus > :deep(li:nth-last-child(1):nth-child(3n + 2)) {
    flex: 1 1 calc((100% - var(--spacing-2)) / 2);
    min-width: calc((100% - var(--spacing-2)) / 2);
  }

  /* 1 item left in the last row → full width, centered. */
  .video-gallery--count-3-plus > :deep(li:nth-child(3n + 1):last-child) {
    width: 100%;
    flex: 0 0 100%;
  }
}

/* Forced fixed column count (e.g. product template: 3 review videos in a
   row). Placed last so it overrides the responsive count-based rules. */
.video-gallery--columns-3 > :deep(li) {
  flex: 1 1 calc((100% - 2 * var(--spacing-2)) / 3);
  min-width: calc((100% - 2 * var(--spacing-2)) / 3);
}
</style>
