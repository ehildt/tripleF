<script setup lang="ts">
import { useId } from 'vue';

import { useHarnessMediaPresentation } from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/composables/use-harness-media-presentation.composable';
import ImageGrid from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/image-grid/ImageGrid.vue';
import AssistantCarousel from '@/components/chat/shared/ui/media-carousel/AssistantCarousel.vue';
import GalleryItemComponent from '@/components/chat/shared/ui/media-carousel/gallery-item/GalleryItem.vue';
import SectionTitle from '@/components/chat/shared/ui/section-title/SectionTitle.vue';

import type { GallerySectionProps } from './GallerySection.types';

defineProps<GallerySectionProps>();

/** Lets the section reference its own title when one is shown. */
const titleId = useId();

/** The prompt-bar presentation switch: gallery (carousel/single) or list. */
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
      v-if="title && (presentation === 'list' || items.length === 1)"
      :id="titleId"
      :title="title"
    />
    <!-- List presentation: the shared responsive tile grid, also used by the
         imagelist template, so both grids stay identical. -->
    <ImageGrid
      v-if="presentation === 'list'"
      :items="items"
      :on-image-click="onImageClick"
    />
    <template v-else>
      <ul
        v-if="items.length === 1"
        class="harness-gallery harness-gallery--single"
      >
        <GalleryItemComponent :item="items[0]" :on-image-click="onImageClick" />
      </ul>
      <AssistantCarousel
        v-else
        :items="items"
        :title="title"
        :title-id="titleId"
        :on-image-click="onImageClick"
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

.harness-gallery--single > :deep(li figure) {
  max-width: none;
  width: 100%;
  height: 100%;
}
</style>
