<script setup lang="ts">
import ResponseHeader from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/response-header/ResponseHeader.vue';

import DiscardedReferencesSection from '../../sections/discarded-references-section/DiscardedReferencesSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import type { CompareResponseProps } from './CompareResponse.types';

defineProps<CompareResponseProps>();
</script>

<template>
  <article class="compare-response">
    <header class="hero">
      <ResponseHeader :title="data.title" :subtitle="data.subtitle" panel />
    </header>
    <GallerySection
      :title="data.galleryTitle"
      :items="data.galleryItems"
      :on-image-click="onImageClick"
    />
    <ParagraphSection
      :title="$t('common.comparison')"
      :content="data.sectionContent"
    />
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="data.videoGalleryItems"
    />
    <p v-if="data.note" class="compare-response__note">{{ data.note }}</p>
    <KeyFindingsSection
      :items="data.keyFindings"
      :title="$t('common.keyFindings')"
    />
    <DiscardedReferencesSection :items="data.discardedReferences" />
    <InternationalCoverageSection :items="data.internationalCoverage" />
    <SourcesSection :items="data.sources" />
  </article>
</template>

<style scoped>
.compare-response {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.compare-response__note {
  font-size: 0.875rem;
  color: var(--color-fg-muted);
  font-style: italic;
}
</style>
