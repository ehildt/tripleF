<script setup lang="ts">
import { useId } from 'vue';

import type { GalleryItem } from '@/types/harness-response-data.model';

import { useHarnessMediaPresentation } from '../../shared/composables/use-harness-media-presentation.composable';
import ImageGrid from '../../shared/ui/image-grid/ImageGrid.vue';
import AssistantCarousel from '../../shared/ui/media-carousel/AssistantCarousel.vue';
import GalleryItemComponent from '../../shared/ui/media-carousel/gallery-item/GalleryItem.vue';
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';

defineProps<{
  title?: string;
  items?: GalleryItem[];
  /** Dense span-grid mosaic (ar4) instead of the carousel, set by the art direction. */
  mosaic?: boolean;
}>();

/** Lets the section reference its own title when one is shown. */
const titleId = useId();

/** The prompt-bar presentation switch: gallery (carousel/mosaic/single) or list. */
const presentation = useHarnessMediaPresentation('image');
</script>

<template>
  <section
    v-if="items?.length"
    class="harness-gallery-section"
    :aria-labelledby="title ? titleId : undefined"
    :aria-label="title ? undefined : $t('common.imageGallery')"
  >
    <SectionTitle
      v-if="title && (presentation === 'list' || items.length === 1 || mosaic)"
      :id="titleId"
      :title="title"
    />
    <!-- List presentation: the shared responsive tile grid, also used by the
         imagelist template, so both grids stay identical. -->
    <ImageGrid v-if="presentation === 'list'" :items="items" />
    <template v-else>
      <ul
        v-if="items.length === 1"
        class="harness-gallery harness-gallery--single"
      >
        <GalleryItemComponent :item="items[0]" />
      </ul>
      <ul v-else-if="mosaic" class="harness-gallery harness-gallery--mosaic">
        <GalleryItemComponent
          v-for="(item, index) in items"
          :key="index"
          :item="item"
        />
      </ul>
      <AssistantCarousel
        v-else
        :items="items"
        :title="title"
        :title-id="titleId"
      />
    </template>
  </section>
</template>

<style scoped>
.harness-gallery-section {
  width: 100%;
  background-color: var(--color-bg-primary);
  padding: var(--spacing-2) var(--spacing-3);
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

/* Mosaic direction (ar4): a dense span-grid of fixed-height rows. Captions
   hide in the mosaic; they still show in the lightbox titles. */
.harness-gallery--mosaic {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: 10rem;
  grid-auto-flow: dense;
  gap: var(--spacing-2);
}

.harness-gallery--mosaic > :deep(li figure) {
  width: 100%;
  min-height: 0;
}

.harness-gallery--mosaic > :deep(li .harness-gallery__trigger) {
  aspect-ratio: auto;
  min-height: 0;
}

.harness-gallery--mosaic :deep(.harness-gallery__caption) {
  display: none;
}

@media (min-width: 640px) {
  .harness-gallery--mosaic {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Repeating span pattern: one big tile, then two, then a wide tile. */
  .harness-gallery--mosaic > :deep(li:nth-child(5n + 1)) {
    grid-column: span 2;
    grid-row: span 2;
  }

  .harness-gallery--mosaic > :deep(li:nth-child(5n + 4)) {
    grid-column: span 2;
  }
}
</style>
