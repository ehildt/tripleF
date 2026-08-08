<script setup lang="ts">
/**
 * Pure image collection: a titled grid of image tiles with dimension badges,
 * source labels, and hover captions. Rendered for the "imagelist" harness
 * template.
 */
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useImageListResponseData } from './composables/use-imagelist-response-data.composable';
import ImageListItem from './image-list-item/ImageListItem.vue';
import type { ImageListResponseProps } from './ImageListResponse.types';

const props = defineProps<ImageListResponseProps>();

const { items, hasContent } = useImageListResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="image-list">
    <header class="image-list__header">
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>

    <ul v-if="items.length" class="image-list__grid">
      <ImageListItem
        v-for="(item, index) in items"
        :key="`${item.imageUrl}-${index}`"
        :item="item"
      />
    </ul>

    <InternationalCoverageSection :items="data.internationalCoverage" />
    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <section v-else class="image-list image-list--empty">
    <p>{{ $t('common.noImagesFound') }}</p>
  </section>
</template>

<style scoped>
.image-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
}

.image-list__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.image-list__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-1);
}

.image-list--empty {
  padding: var(--spacing-4);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  text-align: center;
  color: var(--color-fg-muted);
}
</style>
