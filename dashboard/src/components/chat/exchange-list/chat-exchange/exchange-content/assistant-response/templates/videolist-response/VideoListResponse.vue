<script setup lang="ts">
/**
 * Pure video collection: a titled, numbered playlist of video rows with
 * thumbnails, durations, and channel/views/date metadata. Rendered for the
 * "videolist" harness template.
 */
import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import VideoListItem from './video-list-item/VideoListItem.vue';

const props = defineProps<{ data: HarnessResponseData }>();

const items = computed(() => props.data.videoGalleryItems ?? []);
const hasContent = computed(
  () => Boolean(props.data.title) || items.value.length > 0,
);
</script>

<template>
  <section v-if="hasContent" class="video-list">
    <header class="video-list__header">
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>

    <ol v-if="items.length" class="video-list__playlist">
      <VideoListItem
        v-for="(item, index) in items"
        :key="`${item.videoUrl}-${index}`"
        :item="item"
      />
    </ol>

    <InternationalCoverageSection :items="data.internationalCoverage" />
  </section>

  <!-- Empty state -->
  <section v-else class="video-list video-list--empty">
    <p>No videos found for this request.</p>
  </section>
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

.video-list__playlist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-1);
}

@media (min-width: 640px) {
  .video-list__playlist {
    grid-template-columns: repeat(3, 1fr);
  }
}

.video-list--empty {
  padding: var(--spacing-4);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  text-align: center;
  color: var(--color-fg-muted);
}
</style>
