<script setup lang="ts">
/**
 * A video gallery: two presentations switched from the prompt bar's view
 * menu — the default responsive card grid (list) and a scroll-snap carousel
 * (gallery) in the style of the image gallery. Rendered by the
 * article/news/evaluation/summary/product templates and by the videolist
 * template.
 */
import { computed, useId } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { useHarnessMediaPresentation } from '../../shared/composables/use-harness-media-presentation.composable';
import AssistantCarousel from '../../shared/ui/media-carousel/AssistantCarousel.vue';
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';
import VideoGalleryItemComponent from './video-gallery-item/VideoGalleryItem.vue';

const props = defineProps<{
  title?: string;
  items?: VideoGalleryItem[];
  /** Optional fixed column count (e.g. 3 review videos in a row). When set,
   *  overrides the responsive count-based layout of the list presentation. */
  columns?: number;
}>();

const count = computed(() => props.items?.length ?? 0);

const columnsClass = computed(() =>
  props.columns ? `video-gallery--columns-${props.columns}` : '',
);

/** Lets the section reference its own title when one is shown. */
const titleId = useId();

/** The prompt-bar presentation switch: carousel (gallery) or card grid (list). */
const presentation = useHarnessMediaPresentation('video');
</script>

<template>
  <section
    v-if="items?.length"
    class="video-gallery-section"
    :aria-labelledby="title ? titleId : undefined"
    :aria-label="title ? undefined : $t('common.videoGallery')"
  >
    <!-- Gallery presentation: the shared media carousel, which renders the
         title inside its own header row. -->
    <AssistantCarousel
      v-if="presentation === 'gallery'"
      :items="items"
      :title="title"
      :title-id="titleId"
    />
    <!-- List presentation: the responsive card grid. -->
    <template v-else>
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
    </template>
  </section>
</template>

<style scoped>
.video-gallery-section {
  width: 100%;
  background-color: var(--color-bg-primary);
  padding: var(--spacing-2) var(--spacing-3);
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
     a 2:1 frame, ~89% of a 16:9 video's height. The header became a caption
     overlay, so its former height now belongs to the video. */
  .video-gallery--count-3-plus
    > :deep(li:nth-child(2n + 1):last-child)
    .video-gallery__card {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
  }

  .video-gallery--count-3-plus
    > :deep(li:nth-child(2n + 1):last-child)
    .video-gallery__video {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    aspect-ratio: 2 / 1;
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
     a 2:1 frame, ~89% of a 16:9 video's height. The header became a caption
     overlay, so its former height now belongs to the video. */
  .video-gallery--count-3-plus
    > :deep(li:nth-child(3n + 1):last-child)
    .video-gallery__card {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
  }

  .video-gallery--count-3-plus
    > :deep(li:nth-child(3n + 1):last-child)
    .video-gallery__video {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    aspect-ratio: 2 / 1;
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
