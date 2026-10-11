<script setup lang="ts">
import ResponseHeader from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/response-header/ResponseHeader.vue';

import DiscardedReferencesSection from '../../sections/discarded-references-section/DiscardedReferencesSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import type { DescribeResponseProps } from './DescribeResponse.types';

defineProps<DescribeResponseProps>();
</script>

<template>
  <article class="describe-response">
    <header class="hero">
      <ResponseHeader :title="data.title" :subtitle="data.subtitle" panel />
    </header>
    <p v-if="data.note" class="describe-response__note">{{ data.note }}</p>
    <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
    <ParagraphSection
      :title="$t('common.description')"
      :content="data.sectionContent"
    />
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="data.videoGalleryItems"
    />
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
.describe-response {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.describe-response__note {
  margin: 0;
  font-size: 0.9em;
  color: var(--color-fg-muted);
  padding: var(--spacing-2);
  border-left: 4px solid var(--color-fg-muted);
}
</style>
