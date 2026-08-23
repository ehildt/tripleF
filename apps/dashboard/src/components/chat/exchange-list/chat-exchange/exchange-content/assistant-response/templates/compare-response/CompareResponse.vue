<script setup lang="ts">
import DiscardedReferencesSection from '../../sections/discarded-references-section/DiscardedReferencesSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import ResponseHeader from '../../shared/ui/response-header/ResponseHeader.vue';
import type { CompareResponseProps } from './CompareResponse.types';

defineProps<CompareResponseProps>();
</script>

<template>
  <article class="harness-compare">
    <header class="hero">
      <ResponseHeader :title="data.title" :subtitle="data.subtitle" panel />
    </header>
    <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
    <ParagraphSection
      :title="$t('common.comparison')"
      :content="data.sectionContent"
    />
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="data.videoGalleryItems"
    />
    <p v-if="data.note" class="harness-compare__note">{{ data.note }}</p>
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
.harness-compare {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.harness-compare__note {
  font-size: 0.875rem;
  color: var(--color-fg-muted);
  font-style: italic;
}
</style>
