<script setup lang="ts">
/**
 * Pure image collection: a titled grid of image tiles with dimension badges,
 * source labels, and hover captions. Rendered for the "imagelist" harness
 * template.
 */
import ImageGrid from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/image-grid/ImageGrid.vue';
import ResponseHeader from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/response-header/ResponseHeader.vue';

import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useImageListResponseData } from './composables/use-image-list-response-data.composable';
import type { ImageListResponseProps } from './ImageListResponse.types';

const props = defineProps<ImageListResponseProps>();

const { items, hasContent } = useImageListResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="image-list-response">
    <header class="image-list-response__header">
      <ResponseHeader :title="data.title" :subtitle="data.subtitle" panel />
    </header>

    <ImageGrid
      v-if="items.length"
      :items="items"
      :on-image-click="onImageClick"
    />

    <InternationalCoverageSection :items="data.internationalCoverage" />
    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <EmptyStateSection v-else :message="$t('common.noImagesFound')" />
</template>

<style scoped>
.image-list-response {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
}

.image-list-response__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}
</style>
