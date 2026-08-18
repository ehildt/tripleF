<script setup lang="ts">
/**
 * Pure video collection: a titled grid gallery of videos. Rendered for the
 * "videolist" harness template. Videos always render as the responsive grid
 * gallery.
 */
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useVideoListResponseData } from './composables/use-videolist-response-data.composable';
import type { VideoListResponseProps } from './VideoListResponse.types';

const props = defineProps<VideoListResponseProps>();

const { items, hasContent } = useVideoListResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="video-list">
    <header class="video-list__header">
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>

    <VideoGallerySection :items="items" />

    <InternationalCoverageSection :items="data.internationalCoverage" />
  </section>

  <!-- Empty state -->
  <EmptyStateSection v-else :message="$t('common.noVideosFound')" />
</template>

<style scoped>
.video-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  width: 100%;
}

.video-list__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>
