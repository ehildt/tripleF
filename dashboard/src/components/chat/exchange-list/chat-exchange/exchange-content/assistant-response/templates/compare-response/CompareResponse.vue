<script setup lang="ts">
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import type { CompareResponseProps } from './CompareResponse.types';

defineProps<CompareResponseProps>();
</script>

<template>
  <article class="harness-compare">
    <header class="hero">
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>
    <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
    <ParagraphSection
      :title="$t('common.comparison')"
      :content="data.sectionContent"
    />
    <p v-if="data.note" class="harness-compare__note">{{ data.note }}</p>
    <KeyFindingsSection
      :items="data.keyFindings"
      :title="$t('common.keyFindings')"
    />
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
