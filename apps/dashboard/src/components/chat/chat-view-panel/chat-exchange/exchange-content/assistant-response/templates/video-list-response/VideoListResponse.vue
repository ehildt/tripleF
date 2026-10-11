<script setup lang="ts">
/**
 * Pure video collection: a titled grid gallery of videos. Rendered for the
 * "videolist" harness template. Videos always render as the responsive grid
 * gallery.
 */
import ResponseHeader from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/response-header/ResponseHeader.vue';

import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useVideoListResponseData } from './composables/use-video-list-response-data.composable';
import type { VideoListResponseProps } from './VideoListResponse.types';

const props = defineProps<VideoListResponseProps>();

const { items, hasContent } = useVideoListResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="video-list-response">
    <header class="video-list-response__header">
      <ResponseHeader :title="data.title" :subtitle="data.subtitle" panel />
    </header>

    <VideoGallerySection :items="items" />

    <InternationalCoverageSection :items="data.internationalCoverage" />
  </section>

  <!-- Empty state -->
  <EmptyStateSection v-else :message="$t('common.noVideosFound')" />
</template>

<style scoped>
.video-list-response {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  width: 100%;
}

.video-list-response__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>
