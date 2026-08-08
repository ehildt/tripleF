<script setup lang="ts">
/**
 * A video gallery: an optional title and a responsive card grid of videos
 * (1/2/3 columns depending on count and viewport), with special handling for
 * a lone last-row item. Rendered by the article/news/evaluation/summary/
 * product templates and by the videolist template.
 */
import { computed, useId } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';
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

/** Lets the section reference its own title when one is shown. */
const titleId = useId();
</script>

<template>
  <section
    v-if="items?.length"
    class="video-gallery-section"
    :aria-labelledby="title ? titleId : undefined"
    :aria-label="title ? undefined : $t('common.videoGallery')"
  >
    <SectionTitle v-if="title" :id="titleId" :title="title" />
    <ul
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
        :key="`${item.videoUrl}-${index}`"
        :item="item"
      />
    </ul>
  </section>
</template>

<style scoped>
.video-gallery-section {
  width: 100%;
}

.video-gallery {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-1);
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

@media (min-width: 640px) and (max-width: 1023px) {
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

  /* The lone last-row item keeps full width but is shorter (banner-like):
     the video height is reduced to ~78% of a 16:9 frame. */
  .video-gallery--count-3-plus
    > :deep(li:nth-child(2n + 1):last-child)
    .video-gallery__card {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
  }

  /* Header spans the full card: title left, playlist toggle right. */
  .video-gallery--count-3-plus
    > :deep(li:nth-child(2n + 1):last-child)
    .video-gallery__header {
    width: 100%;
  }

  .video-gallery--count-3-plus
    > :deep(li:nth-child(2n + 1):last-child)
    .video-gallery__video {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    aspect-ratio: 16 / 7;
    height: auto;
    max-height: 100%;
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

  /* The lone last-row item keeps full width but is shorter (banner-like):
     the video height is reduced to ~78% of a 16:9 frame. */
  .video-gallery--count-3-plus
    > :deep(li:nth-child(3n + 1):last-child)
    .video-gallery__card {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
  }

  /* Header spans the full card: title left, playlist toggle right. */
  .video-gallery--count-3-plus
    > :deep(li:nth-child(3n + 1):last-child)
    .video-gallery__header {
    width: 100%;
  }

  .video-gallery--count-3-plus
    > :deep(li:nth-child(3n + 1):last-child)
    .video-gallery__video {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    aspect-ratio: 16 / 7;
    height: auto;
    max-height: 100%;
  }
}

/* Forced fixed column count (e.g. product template: 3 review videos in a
   row). Placed last so it overrides the responsive count-based rules. */
.video-gallery--columns-3 > :deep(li) {
  flex: 1 1 calc((100% - 2 * var(--spacing-2)) / 3);
  min-width: calc((100% - 2 * var(--spacing-2)) / 3);
}
</style>
