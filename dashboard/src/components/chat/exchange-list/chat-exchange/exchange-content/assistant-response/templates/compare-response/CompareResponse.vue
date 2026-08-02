<script setup lang="ts">
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import ResponseMetaBarPill from '../../shared/ui/response-meta-bar/response-meta-bar-pill/ResponseMetaBarPill.vue';
import ResponseMetaBar from '../../shared/ui/response-meta-bar/ResponseMetaBar.vue';

defineProps<{
  data: HarnessResponseData;
}>();
</script>

<template>
  <article class="harness-compare">
    <header class="hero">
      <ResponseMetaBar>
        <ResponseMetaBarPill v-if="data.category" variant="accent">{{
          data.category
        }}</ResponseMetaBarPill>
      </ResponseMetaBar>
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>
    <GallerySection :items="data.galleryItems" />
    <ParagraphSection title="Comparison" :content="data.sectionContent" />
    <p v-if="data.note" class="harness-compare__note">{{ data.note }}</p>
    <KeyFindingsSection title="Key Differences" :items="data.keyFindings" />
    <SourcesSection :items="data.sources" />
    <InternationalCoverageSection :items="data.internationalCoverage" />
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
