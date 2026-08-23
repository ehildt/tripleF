<script setup lang="ts">
/**
 * Pure image collection: a titled grid of image tiles with dimension badges,
 * source labels, and hover captions. Rendered for the "imagelist" harness
 * template.
 */
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import ImageGrid from '../../shared/ui/image-grid/ImageGrid.vue';
import ResponseHeader from '../../shared/ui/response-header/ResponseHeader.vue';
import { useImageListResponseData } from './composables/use-imagelist-response-data.composable';
import type { ImageListResponseProps } from './ImageListResponse.types';

const props = defineProps<ImageListResponseProps>();

const { items, hasContent } = useImageListResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="image-list">
    <header class="image-list__header">
      <ResponseHeader :title="data.title" :subtitle="data.subtitle" panel />
    </header>

    <ImageGrid v-if="items.length" :items="items" />

    <InternationalCoverageSection :items="data.internationalCoverage" />
    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <EmptyStateSection v-else :message="$t('common.noImagesFound')" />
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
</style>
